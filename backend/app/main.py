from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
from datetime import datetime
import pymongo
from pymongo import MongoClient
import pandas as pd
import io
import json
import os
from bson import ObjectId

from .models.container import Container, Dimensions, ContainerCreate
from .models.item import Item, Position, ItemCreate
from .services.placement_service import PlacementService
# from .services.retrieval_service import RetrievalService

# Initialize FastAPI app
app = FastAPI(title="Space Stowage Management System")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection string from environment variable or default
mongo_uri = os.environ.get("MONGODB_URI", "mongodb+srv://vanshchheda:Mj9rlwt3DJcpTDsw@cluster0.g9d1lnn.mongodb.net/")
db_name = os.environ.get("DB_NAME", "space_stowage")

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client[db_name]

# Initialize services
placement_service = PlacementService(client)
# retrieval_service = RetrievalService(client)

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Space Stowage Management System API", "status": "online"}

@app.get("/api/containers", response_model=List[Dict])
async def get_containers():

    # Get all containers

    try:
        containers = list(db.containers.find({}))
        # Convert ObjectId to string for JSON serialization
        for container in containers:
            if "_id" in container:
                container["_id"] = str(container["_id"])
        return JSONResponse(content=containers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/items", response_model=List[Dict])
async def get_items():

    # Get all items

    try:
        items = list(db.items.find({}))
        # Convert ObjectId to string for JSON serialization
        for item in items:
            if "_id" in item:
                item["_id"] = str(item["_id"])
        return JSONResponse(content=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/containers", response_model=Dict)
async def create_container(container: ContainerCreate):

    # Create a new container

    try:
        container_dict = {
            "container_id": container.container_id,
            "zone": container.zone,
            "dimensions": {
                "width": container.width,
                "depth": container.depth,
                "height": container.height
            },
            "occupied_volume": 0
        }
        
        result = db.containers.insert_one(container_dict)
        container_dict["_id"] = str(result.inserted_id)
        
        return container_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/items", response_model=Dict)
async def create_item(item: ItemCreate):

    # Create a new item

    try:
        expiry_date = None
        if item.expiry_date:
            expiry_date = datetime.fromisoformat(item.expiry_date)
            
        item_dict = {
            "item_id": item.item_id,
            "name": item.name,
            "dimensions": {
                "width": item.width,
                "depth": item.depth,
                "height": item.height
            },
            "mass": item.mass,
            "priority": item.priority,
            "expiry_date": expiry_date,
            "usage_limit": item.usage_limit,
            "usage_count": 0,
            "preferred_zone": item.preferred_zone,
            "is_waste": False
        }
        
        result = db.items.insert_one(item_dict)
        item_dict["_id"] = str(result.inserted_id)
        
        return item_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/placement")
async def placement(request: Dict = Body(...)):

    # Placement API endpoint
    #Place items in containers based on optimal algorithms

    if "items" not in request or "containers" not in request:
        raise HTTPException(status_code=400, detail="Items and containers are required")
    
    try:
        result = await placement_service.place_items(request["items"], request["containers"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/placement/simulate")
async def simulate_placement(request: Dict = Body(...)):

    # Simulate placement without saving to database
    # [ Useful for previewing placement results before committing ]

    if "items" not in request or "containers" not in request:
        raise HTTPException(status_code=400, detail="Items and containers are required")
    
    try:
        # Similar to place_items but without saving to database
        items = []
        for item_data in request["items"]:
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
        for container_data in request["containers"]:
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
        
        # Get bin packing solution without saving to DB
        from .algorithms.bin_packing import BinPacker
        packing_result = BinPacker.place_items(items, containers)
        
        return packing_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/place")
async def place_item(request: Dict = Body(...)):

    # Place a specific item in a container at a given position

    required_fields = ["itemId", "userId", "timestamp", "containerId", "position"]
    for field in required_fields:
        if field not in request:
            raise HTTPException(status_code=400, detail=f"{field} is required")
    
    try:
        result = await placement_service.place_item(
            request["itemId"],
            request["userId"],
            request["timestamp"],
            request["containerId"],
            request["position"]
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/placement/suggestion/{item_id}")
async def get_placement_suggestion(item_id: str):

    # Get placement suggestion for a specific item

    try:
        #get item from database
        item_doc = db.items.find_one({"item_id": item_id})
        if not item_doc:
            raise HTTPException(status_code=404, detail="Item not found")
        
        #convert to Item model
        item = Item(
            item_id=item_doc["item_id"],
            name=item_doc["name"],
            dimensions=Dimensions(
                width=item_doc["dimensions"]["width"],
                depth=item_doc["dimensions"]["depth"],
                height=item_doc["dimensions"]["height"]
            ),
            mass=item_doc["mass"],
            priority=item_doc["priority"],
            expiry_date=item_doc.get("expiry_date"),
            usage_limit=item_doc["usage_limit"],
            usage_count=item_doc.get("usage_count", 0),
            preferred_zone=item_doc["preferred_zone"]
        )
        
        #get containers from database
        containers = []
        cursor = db.containers.find({})
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
        
        #Find best placement
        from .utils.spatial_grid import SpatialGrid
        
        best_container = None
        best_position = None
        best_score = float('inf')
        
        # First try preferred zone
        for container in containers:
            if container.zone != item.preferred_zone:
                continue
                
            grid = SpatialGrid(container)
            
            #Load existing items into the grid
            items_in_container = db.items.find({"container_id": container.container_id})
            for existing_item in items_in_container:
                if "position" in existing_item and existing_item["position"]:
                    pos = existing_item["position"]
                    position = Position(
                        start_coordinates=Dimensions(
                            width=pos["start_coordinates"]["width"],
                            depth=pos["start_coordinates"]["depth"],
                            height=pos["start_coordinates"]["height"]
                        ),
                        end_coordinates=Dimensions(
                            width=pos["end_coordinates"]["width"],
                            depth=pos["end_coordinates"]["depth"],
                            height=pos["end_coordinates"]["height"]
                        )
                    )
                    existing_item_obj = Item(
                        item_id=existing_item["item_id"],
                        name=existing_item["name"],
                        dimensions=Dimensions(
                            width=existing_item["dimensions"]["width"],
                            depth=existing_item["dimensions"]["depth"],
                            height=existing_item["dimensions"]["height"]
                        ),
                        mass=existing_item["mass"],
                        priority=existing_item["priority"],
                        expiry_date=existing_item.get("expiry_date"),
                        usage_limit=existing_item["usage_limit"],
                        usage_count=existing_item.get("usage_count", 0),
                        preferred_zone=existing_item["preferred_zone"],
                        position=position,
                        container_id=container.container_id
                    )
                    grid.place_item(existing_item_obj, position)
            
            position = grid.find_best_fit(item.dimensions)
            if position:
                # Score based on position (prefer preferred zone)
                score = 0  # Preferred zone gets 0 penalty
                score += position.start_coordinates.height * 10  # Prefer lower positions
                score += position.start_coordinates.width  # Prefer leftmost positions
                score += position.start_coordinates.depth  # Prefer deepest positions
                
                if score < best_score:
                    best_score = score
                    best_container = container
                    best_position = position
        
        #If no position found in preferred zone, try other zones
        if best_position is None:
            for container in containers:
                if container.zone == item.preferred_zone:
                    continue  # Already tried preferred zone
                    
                grid = SpatialGrid(container)
                
                # Load existing items into the grid
                items_in_container = db.items.find({"container_id": container.container_id})
                for existing_item in items_in_container:
                    if "position" in existing_item and existing_item["position"]:
                        pos = existing_item["position"]
                        position = Position(
                            start_coordinates=Dimensions(
                                width=pos["start_coordinates"]["width"],
                                depth=pos["start_coordinates"]["depth"],
                                height=pos["start_coordinates"]["height"]
                            ),
                            end_coordinates=Dimensions(
                                width=pos["end_coordinates"]["width"],
                                depth=pos["end_coordinates"]["depth"],
                                height=pos["end_coordinates"]["height"]
                            )
                        )
                        existing_item_obj = Item(
                            item_id=existing_item["item_id"],
                            name=existing_item["name"],
                            dimensions=Dimensions(
                                width=existing_item["dimensions"]["width"],
                                depth=existing_item["dimensions"]["depth"],
                                height=existing_item["dimensions"]["height"]
                            ),
                            mass=existing_item["mass"],
                            priority=existing_item["priority"],
                            expiry_date=existing_item.get("expiry_date"),
                            usage_limit=existing_item["usage_limit"],
                            usage_count=existing_item.get("usage_count", 0),
                            preferred_zone=existing_item["preferred_zone"],
                            position=position,
                            container_id=container.container_id
                        )
                        grid.place_item(existing_item_obj, position)
                
                position = grid.find_best_fit(item.dimensions)
                if position:
                    #Score based on position (with penalty for non-preferred zone)
                    score = 1000  # Non-preferred zone penalty
                    score += position.start_coordinates.height * 10  # Prefer lower positions
                    score += position.start_coordinates.width  # Prefer leftmost positions
                    score += position.start_coordinates.depth  # Prefer deepest positions
                    
                    if score < best_score:
                        best_score = score
                        best_container = container
                        best_position = position
        
        if best_position is None:
            return {"success": False, "message": "No suitable placement found"}
        
        return {
            "success": True,
            "suggestion": {
                "itemId": item.item_id,
                "containerId": best_container.container_id,
                "containerZone": best_container.zone,
                "position": {
                    "startCoordinates": {
                        "width": best_position.start_coordinates.width,
                        "depth": best_position.start_coordinates.depth,
                        "height": best_position.start_coordinates.height
                    },
                    "endCoordinates": {
                        "width": best_position.end_coordinates.width,
                        "depth": best_position.end_coordinates.depth,
                        "height": best_position.end_coordinates.height
                    }
                },
                "isPreferedZone": best_container.zone == item.preferred_zone
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import/containers")
async def import_containers(file: UploadFile = File(...)):

    # Import containers from CSV file

    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        
        containers = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                container = {
                    "container_id": row["container_id"],
                    "zone": row["zone"],
                    "dimensions": {
                        "width": float(row["width_cm"]),
                        "depth": float(row["depth_cm"]),
                        "height": float(row["height_cm"])
                    },
                    "occupied_volume": 0
                }
                
                # Update or insert container
                db.containers.update_one(
                    {"container_id": container["container_id"]},
                    {"$set": container},
                    upsert=True
                )
                
                containers.append(container)
                
            except Exception as e:
                errors.append({
                    "row": index + 2,  # +2 for header row and 0-indexing
                    "message": str(e)
                })
        
        return {
            "success": True,
            "containersImportedCount": len(containers),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import/items")
async def import_items(file: UploadFile = File(...)):

    # Import items from CSV file

    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        
        items = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                expiry_date = None
                if "Expiry Date" in row and row["Expiry Date"] and row["Expiry Date"].lower() != "n/a":
                    expiry_date = row["Expiry Date"]
                
                item = {
                    "item_id": row["Item ID"],
                    "name": row["Name"],
                    "dimensions": {
                        "width": float(row["Width (cm)"]),
                        "depth": float(row["Depth (cm)"]),
                        "height": float(row["Height (cm)"])
                    },
                    "mass": float(row["Mass (kg)"]),
                    "priority": int(row["Priority (1-100)"]),
                    "expiry_date": expiry_date,
                    "usage_limit": int(row["Usage Limit"]),
                    "usage_count": 0,
                    "preferred_zone": row["Preferred Zone"],
                    "is_waste": False
                }
                
                # Update or insert item
                db.items.update_one(
                    {"item_id": item["item_id"]},
                    {"$set": item},
                    upsert=True
                )
                
                items.append(item)
                
            except Exception as e:
                errors.append({
                    "row": index + 2,  # +2 for header row and 0-indexing
                    "message": str(e)
                })
        
        return {
            "success": True,
            "itemsImported": len(items),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():

    # Get system statistics (# TO-DO: ADD MORE!)

    try:
        # Count total items
        total_items = db.items.count_documents({})
        
        # Count placed items
        placed_items = db.items.count_documents({"container_id": {"$ne": None}})
        
        # Count containers
        total_containers = db.containers.count_documents({})
        
        # Get total volume of all containers
        containers = list(db.containers.find({}))
        total_volume = 0
        used_volume = 0
        for container in containers:
            dimensions = container["dimensions"]
            volume = dimensions["width"] * dimensions["depth"] * dimensions["height"]
            total_volume += volume
            used_volume += container.get("occupied_volume", 0)
        
        # Space utilization percentage
        space_utilization = 0
        if total_volume > 0:
            space_utilization = (used_volume / total_volume) * 100
        
        # Get zone stats
        zones = {}
        for container in containers:
            zone = container["zone"]
            if zone not in zones:
                zones[zone] = {
                    "containers": 0,
                    "items": 0,
                    "volume": 0,
                    "usedVolume": 0
                }
            zones[zone]["containers"] += 1
            
            dimensions = container["dimensions"]
            volume = dimensions["width"] * dimensions["depth"] * dimensions["height"]
            zones[zone]["volume"] += volume
            zones[zone]["usedVolume"] += container.get("occupied_volume", 0)
        
        # Count items in each zone
        zone_items = db.items.aggregate([
            {"$match": {"container_id": {"$ne": None}}},
            {"$lookup": {
                "from": "containers",
                "localField": "container_id",
                "foreignField": "container_id",
                "as": "container"
            }},
            {"$unwind": "$container"},
            {"$group": {
                "_id": "$container.zone",
                "count": {"$sum": 1}
            }}
        ])
        
        for zone_item in zone_items:
            zone = zone_item["_id"]
            if zone in zones:
                zones[zone]["items"] = zone_item["count"]
        
        return {
            "totalItems": total_items,
            "placedItems": placed_items,
            "totalContainers": total_containers,
            "totalVolume": total_volume,
            "usedVolume": used_volume,
            "spaceUtilization": space_utilization,
            "zones": zones
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)