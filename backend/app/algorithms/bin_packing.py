from typing import List, Dict, Tuple, Optional
import time
import logging
from ..models.container import Container, Dimensions
from ..models.item import Item, Position
from ..utils.spatial_grid import SpatialGrid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BinPacker:

    # 3D bin packing algorithms for optimal placement of items in containers.

    
    @staticmethod
    def place_items(items: List[Item], containers: List[Container]) -> Dict:
    
        # Place items in containers using an optimized First-Fit Decreasing algorithm
        # with zone preferences and multi-orientation support.
        
        #returns a dictionary of placement results and rearrangement suggestions
    
        start_time = time.time()
        print(f"Starting bin packing with {len(items)} items and {len(containers)} containers")
        
        #Sort items by priority (descending) and then by volume (descending)
        # This ensures high priority items are placed first and larger items get better positions
        sorted_items = sorted(items, key=lambda x: (x.priority, x.calculate_volume()), reverse=True)
        print(f"Sorted {len(sorted_items)} items by priority and volume")
        
        # Group containers by zone for preferred placement
        containers_by_zone = {}
        for container in containers:
            if container.zone not in containers_by_zone:
                containers_by_zone[container.zone] = []
            containers_by_zone[container.zone].append(container)
        
        #Sort containers within each zone by available space (descending)
        for zone, zone_containers in containers_by_zone.items():
            zone_containers.sort(key=lambda x: x.get_available_volume(), reverse=True)
        
        print(f"Grouped containers into {len(containers_by_zone)} zones")
        
        # Initialize spatial grids for each container
        spatial_grids = {}
        for container in containers:
            print(f"Initializing grid for container {container.container_id}")
            spatial_grids[container.container_id] = SpatialGrid(container)
        
        placements = []
        unplaced_items = []
        
        #Try to place each item
        for index, item in enumerate(sorted_items):
            if index % 10 == 0:  # Log every 10 items for performance
                print(f"Processing item {index+1}/{len(sorted_items)}: {item.item_id}")
                
            placed = False
            best_position = None
            best_container = None
            best_score = float('inf')  # Lower is better
            
            # Calculate item volume once
            item_volume = item.calculate_volume()
            
            #Try preferred zone first with containers that have enough space
            if item.preferred_zone in containers_by_zone:
                print(f"Trying preferred zone '{item.preferred_zone}' for item {item.item_id}")
                preferred_containers = containers_by_zone[item.preferred_zone]
                
                for container in preferred_containers:
                    # Skip if container doesn't have enough space
                    if container.get_available_volume() < item_volume:
                        continue
                        
                    grid = spatial_grids[container.container_id]
                    position = grid.find_best_fit(item.dimensions)
                    
                    if position:
                        # Calculate score (0 base score for preferred zone)
                        score = position.start_coordinates.height * 10  # Prefer lower positions
                        score += position.start_coordinates.width  # Prefer leftmost positions
                        score += position.start_coordinates.depth  # Prefer deepest positions
                        
                        if score < best_score:
                            best_score = score
                            best_position = position
                            best_container = container
                
                # If found in preferred zone, place it
                if best_position:
                    print(f"Found placement in preferred zone for item {item.item_id}")
                    item_with_position = item.copy()
                    item_with_position.position = best_position
                    item_with_position.container_id = best_container.container_id
                    
                    grid = spatial_grids[best_container.container_id]
                    grid.place_item(item_with_position, best_position)
                    
                    placements.append({
                        "itemId": item.item_id,
                        "containerId": best_container.container_id,
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
                        }
                    })
                    
                    placed = True
            
            #If not placed in preferred zone, try other zones
            if not placed:
                print(f"Trying non-preferred zones for item {item.item_id}")
                # Reset best values for non-preferred zones
                best_position = None
                best_container = None
                best_score = float('inf')
                
                for container in containers:
                    # Skip if container doesn't have enough space or is in preferred zone (already tried)
                    if (container.get_available_volume() < item_volume or 
                        container.zone == item.preferred_zone):
                        continue
                        
                    grid = spatial_grids[container.container_id]
                    position = grid.find_best_fit(item.dimensions)
                    
                    if position:
                        # Calculate score (1000 base penalty for non-preferred zone)
                        score = 1000  # Non-preferred zone penalty
                        score += position.start_coordinates.height * 10  # Prefer lower positions
                        score += position.start_coordinates.width  # Prefer leftmost positions
                        score += position.start_coordinates.depth  # Prefer deepest positions
                        
                        if score < best_score:
                            best_score = score
                            best_position = position
                            best_container = container
                
                if best_position:
                    print(f"Found placement in non-preferred zone for item {item.item_id}")
                    item_with_position = item.copy()
                    item_with_position.position = best_position
                    item_with_position.container_id = best_container.container_id
                    
                    grid = spatial_grids[best_container.container_id]
                    grid.place_item(item_with_position, best_position)
                    
                    placements.append({
                        "itemId": item.item_id,
                        "containerId": best_container.container_id,
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
                        }
                    })
                    
                    placed = True
            
            if not placed:
                print(f"Unable to place item {item.item_id}")
                unplaced_items.append(item)
        
        print(f"Bin packing completed: {len(placements)} items placed, {len(unplaced_items)} items unplaced")
        print(f"Total time: {time.time() - start_time:.2f} seconds")
        
        # Generate simple rearrangement suggestions for unplaced items
        rearrangements = []
        
        # If there are unplaced items, suggest expanding containers
        if unplaced_items:
            # Calculate total volume needed for unplaced items
            total_unplaced_volume = sum(item.calculate_volume() for item in unplaced_items)
            
            # Suggest container expansion
            rearrangements.append({
                "type": "expansion",
                "message": f"Need additional {total_unplaced_volume:.2f} cubic units of space",
                "items": [item.item_id for item in unplaced_items]
            })
        
        return {
            "success": len(unplaced_items) == 0,
            "placements": placements,
            "rearrangements": rearrangements,
            "unplaced_items": [item.item_id for item in unplaced_items]
        }