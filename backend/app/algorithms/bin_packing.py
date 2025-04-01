from typing import List, Dict, Tuple, Optional
from ..models.container import Container, Dimensions
from ..models.item import Item, Position
from ..utils.spatial_grid import SpatialGrid


class BinPacker:

    # 3D bin packing algorithms for optimal placement of items in containers.

    
    @staticmethod
    def place_items(items: List[Item], containers: List[Container]) -> Dict:
    
        # Place items in containers using First-Fit Decreasing algorithm
        #returns a dictionary of placement results and rearrangement suggestions
    
        #Sort items by priority (descending)
        sorted_items = sorted(items, key=lambda x: x.priority, reverse=True)
        
        # Group containers by zone for preferred placement
        containers_by_zone = {}
        for container in containers:
            if container.zone not in containers_by_zone:
                containers_by_zone[container.zone] = []
            containers_by_zone[container.zone].append(container)
        
        # Initialize spatial grids for each container
        spatial_grids = {container.container_id: SpatialGrid(container) for container in containers}
        
        placements = []
        unplaced_items = []
        
        #Try to place each item in its preferred zone first
        for item in sorted_items:
            placed = False
            
            #Try preferred zone first
            if item.preferred_zone in containers_by_zone:
                preferred_containers = containers_by_zone[item.preferred_zone]
                for container in preferred_containers:
                    grid = spatial_grids[container.container_id]
                    best_position = grid.find_best_fit(item.dimensions)
                    
                    if best_position:
                        #Item fits in preferred zone
                        item_with_position = item.copy()
                        item_with_position.position = best_position
                        item_with_position.container_id = container.container_id
                        
                        grid.place_item(item_with_position, best_position)
                        
                        placements.append({
                            "itemId": item.item_id,
                            "containerId": container.container_id,
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
                        break
            
            #If not placed in preferred zone, try other zones
            if not placed:
                for container in containers:
                    if container.zone == item.preferred_zone:
                        continue  # Already tried preferred zone
                        
                    grid = spatial_grids[container.container_id]
                    best_position = grid.find_best_fit(item.dimensions)
                    
                    if best_position:
                        # Item fits in non-preferred zone
                        item_with_position = item.copy()
                        item_with_position.position = best_position
                        item_with_position.container_id = container.container_id
                        
                        grid.place_item(item_with_position, best_position)
                        
                        placements.append({
                            "itemId": item.item_id,
                            "containerId": container.container_id,
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
                        break
            
            if not placed:
                unplaced_items.append(item)
        
        # TO-DO: Implement rearrangement suggestions for unplaced items
        rearrangements = []
        
        return {
            "success": len(unplaced_items) == 0,
            "placements": placements,
            "rearrangements": rearrangements,
            "unplaced_items": [item.item_id for item in unplaced_items]
        }