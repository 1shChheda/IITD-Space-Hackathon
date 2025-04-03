from fastapi import HTTPException
from typing import List, Dict, Optional
from pymongo import MongoClient
from datetime import datetime
import time
import logging
from ..models.container import Container, Dimensions
from ..models.item import Item, Position
from ..algorithms.bin_packing import BinPacker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlacementService:

    #Service for handling item placement in containers

    
    def __init__(self, db_client):
        #Initialize with database client
        self.db = db_client.space_stowage
        self.items_collection = self.db.items
        self.containers_collection = self.db.containers
        self.logs_collection = self.db.logs
    
    async def get_containers(self) -> List[Container]:
        #Get all containers from the database
        containers = []
        cursor = self.containers_collection.find({})
        for doc in cursor:
            container = Container(
                container_id=doc["container_id"],
                zone=doc["zone"],
                dimensions=Dimensions(
                    width=doc["dimensions"]["width"],
                    depth=doc["dimensions"]["depth"],
                    height=doc["dimensions"]["height"]
                ),
                occupied_volume=doc.get("occupied_volume", 0)
            )
            containers.append(container)
        return containers
    
    async def get_items(self) -> List[Item]:
        # Get all items from the database
        items = []
        cursor = self.items_collection.find({})
        for doc in cursor:
            position = None
            if "position" in doc and doc["position"]:
                position = Position(
                    start_coordinates=Dimensions(
                        width=doc["position"]["start_coordinates"]["width"],
                        depth=doc["position"]["start_coordinates"]["depth"],
                        height=doc["position"]["start_coordinates"]["height"]
                    ),
                    end_coordinates=Dimensions(
                        width=doc["position"]["end_coordinates"]["width"],
                        depth=doc["position"]["end_coordinates"]["depth"],
                        height=doc["position"]["end_coordinates"]["height"]
                    )
                )
            
            expiry_date = None
            if "expiry_date" in doc and doc["expiry_date"]:
                expiry_date = datetime.fromisoformat(doc["expiry_date"])
                
            item = Item(
                item_id=doc["item_id"],
                name=doc["name"],
                dimensions=Dimensions(
                    width=doc["dimensions"]["width"],
                    depth=doc["dimensions"]["depth"],
                    height=doc["dimensions"]["height"]
                ),
                mass=doc["mass"],
                priority=doc["priority"],
                expiry_date=expiry_date,
                usage_limit=doc["usage_limit"],
                usage_count=doc.get("usage_count", 0),
                preferred_zone=doc["preferred_zone"],
                container_id=doc.get("container_id"),
                position=position,
                is_waste=doc.get("is_waste", False),
                waste_reason=doc.get("waste_reason")
            )
            items.append(item)
        return items
    
    async def place_items(self, items_data: List[Dict], containers_data: List[Dict]) -> Dict:
    
        #Place items in containers and save results to database
    
        start_time = time.time()
        logger.info(f"Starting placement of {len(items_data)} items in {len(containers_data)} containers")

        try:
            # Convert input data to model objects
            items = []
            for item_data in items_data:
                print(f"Converting item: {item_data['itemId']}")
                expiry_date = None
                if "expiryDate" in item_data and item_data["expiryDate"]:
                    expiry_date = datetime.fromisoformat(item_data["expiryDate"])
                    
                item = Item(
                    item_id=item_data["itemId"],
                    name=item_data["name"],
                    dimensions=Dimensions(
                        width=item_data["width"],
                        depth=item_data["depth"],
                        height=item_data["height"]
                    ),
                    mass=item_data["mass"],
                    priority=item_data["priority"],
                    expiry_date=expiry_date,
                    usage_limit=item_data["usageLimit"],
                    usage_count=0,
                    preferred_zone=item_data["preferredZone"]
                )
                items.append(item)
            
            containers = []
            for container_data in containers_data:
                print(f"Converting container: {container_data['containerId']}")
                container = Container(
                    container_id=container_data["containerId"],
                    zone=container_data["zone"],
                    dimensions=Dimensions(
                        width=container_data["width"],
                        depth=container_data["depth"],
                        height=container_data["height"]
                    ),
                    occupied_volume=0
                )
                containers.append(container)
            
            # Get bin packing solution
            print("Calling bin packer algorithm...")
            packing_result = BinPacker.place_items(items, containers)
            print(f"Bin packing completed in {time.time() - start_time:.2f} seconds")
            
            # Save results to database if successful
            if packing_result["success"]:

                print(f"Saving {len(packing_result['placements'])} placements to database")

                #update containers in database
                for container in containers:
                    self.containers_collection.update_one(
                        {"container_id": container.container_id},
                        {"$set": container.dict()},
                        upsert=True
                    )
                
                # Update items in database
                for placement in packing_result["placements"]:
                    item_id = placement["itemId"]
                    container_id = placement["containerId"]
                    position = placement["position"]
                    
                    # Update item with container and position
                    self.db.items.update_one(
                        {"item_id": item_id},
                        {"$set": {
                            "container_id": container_id,
                            "position": {
                                "start_coordinates": position["startCoordinates"],
                                "end_coordinates": position["endCoordinates"]
                            }
                        }}
                    )
                    
                    # Calculate volume for this item
                    width = position["endCoordinates"]["width"] - position["startCoordinates"]["width"]
                    depth = position["endCoordinates"]["depth"] - position["startCoordinates"]["depth"]
                    height = position["endCoordinates"]["height"] - position["startCoordinates"]["height"]
                    volume = width * depth * height
                    
                    # Update container occupied volume
                    self.containers_collection.update_one(
                        {"container_id": container_id},
                        {"$inc": {"occupied_volume": volume}}
                    )
                
            logger.info(f"Placement completed in {time.time() - start_time:.2f} seconds")
            
            return packing_result
        
        except Exception as e:
            logger.error(f"Error in place_items: {str(e)}")
            print(f"ERROR in placement: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def place_item(self, item_id: str, user_id: str, timestamp: str, 
                         container_id: str, position: Dict) -> Dict:

        #Place a specific item in a container at the given position


        #Get the item from the database
        item_doc = self.items_collection.find_one({"item_id": item_id})
        if not item_doc:
            return {"success": False, "message": "Item not found"}
        
        #Get the container from the database
        container_doc = self.containers_collection.find_one({"container_id": container_id})
        if not container_doc:
            return {"success": False, "message": "Container not found"}
        
        #update item position
        old_container_id = item_doc.get("container_id")
        
        self.items_collection.update_one(
            {"item_id": item_id},
            {"$set": {
                "container_id": container_id,
                "position": {
                    "start_coordinates": {
                        "width": position["startCoordinates"]["width"],
                        "depth": position["startCoordinates"]["depth"],
                        "height": position["startCoordinates"]["height"]
                    },
                    "end_coordinates": {
                        "width": position["endCoordinates"]["width"],
                        "depth": position["endCoordinates"]["depth"],
                        "height": position["endCoordinates"]["height"]
                    }
                }
            }}
        )
        
        # Log the placement action
        self.logs_collection.insert_one({
            "timestamp": datetime.fromisoformat(timestamp).isoformat(),
            "user_id": user_id,
            "action_type": "placement",
            "item_id": item_id,
            "details": {
                "from_container": old_container_id,
                "to_container": container_id,
                "position": position
            }
        })
        
        return {"success": True}