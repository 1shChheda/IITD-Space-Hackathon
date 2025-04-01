from typing import Dict, List, Tuple, Optional, Set
from ..models.container import Container, Dimensions
from ..models.item import Item, Position


class SpatialGrid:

    #a 3D grid representation of a container for efficient item placement and retrieval.
    #The grid is a 3D array where each cell represents a 1x1x1 volume.
    #NOTE: Each cell can be either empty or occupied by an item.


    def __init__(self, container: Container):
        #Initialize the grid based on container dimensions
        self.container = container
        self.width = int(container.dimensions.width)
        self.depth = int(container.dimensions.depth)
        self.height = int(container.dimensions.height)
        # Initialize an empty 3D grid
        self.grid = [[[None for _ in range(self.height)] 
                      for _ in range(self.depth)] 
                     for _ in range(self.width)]
        self.items = {}  # Map of item_id to Item
        
    def is_valid_position(self, x: int, y: int, z: int) -> bool:
        #Check if the given coordinates are within bounds
        return (0 <= x < self.width and 
                0 <= y < self.depth and 
                0 <= z < self.height)
    
    def is_position_empty(self, x: int, y: int, z: int) -> bool:
        #Check if the given position is empty
        if not self.is_valid_position(x, y, z):
            return False
        return self.grid[x][y][z] is None
    
    def is_region_empty(self, x1: int, y1: int, z1: int, 
                        x2: int, y2: int, z2: int) -> bool:
        #Check if the given region is empty
        if (not self.is_valid_position(x1, y1, z1) or 
            not self.is_valid_position(x2-1, y2-1, z2-1)):
            return False
        
        for x in range(x1, x2):
            for y in range(y1, y2):
                for z in range(z1, z2):
                    if not self.is_position_empty(x, y, z):
                        return False
        return True
    
    def place_item(self, item: Item, position: Position) -> bool:
    
        #Place an item at the specified position
        #Returns True if the item was successfully placed, False otherwise
    
        x1 = int(position.start_coordinates.width)
        y1 = int(position.start_coordinates.depth)
        z1 = int(position.start_coordinates.height)
        x2 = int(position.end_coordinates.width)
        y2 = int(position.end_coordinates.depth)
        z2 = int(position.end_coordinates.height)
        
        #Check if the region is empty
        if not self.is_region_empty(x1, y1, z1, x2, y2, z2):
            return False
        
        #Place the item
        for x in range(x1, x2):
            for y in range(y1, y2):
                for z in range(z1, z2):
                    self.grid[x][y][z] = item.item_id
        
        #Update the items dictionary
        self.items[item.item_id] = item
        
        #Update container's occupied volume
        self.container.occupied_volume += item.calculate_volume()
        
        return True
    
    def remove_item(self, item_id: str) -> bool:
    
        #Remove an item from the grid
        #Returns True if the item was successfully removed, False otherwise
    
        if item_id not in self.items:
            return False
        
        item = self.items[item_id]
        position = item.position
        
        if position is None:
            return False
        
        x1 = int(position.start_coordinates.width)
        y1 = int(position.start_coordinates.depth)
        z1 = int(position.start_coordinates.height)
        x2 = int(position.end_coordinates.width)
        y2 = int(position.end_coordinates.depth)
        z2 = int(position.end_coordinates.height)
        
        #Remove the item from the grid
        for x in range(x1, x2):
            for y in range(y1, y2):
                for z in range(z1, z2):
                    if self.grid[x][y][z] == item_id:
                        self.grid[x][y][z] = None
        
        #Update container's occupied volume
        self.container.occupied_volume -= item.calculate_volume()
        
        #Remove from items dictionary
        del self.items[item_id]
        
        return True
        
    def find_best_fit(self, item_dimensions: Dimensions) -> Optional[Position]:
    
        #Find the best position to place an item using first-fit decreasing algorithm
        #Tries to place the item at the lowest, leftmost, deepest position
    
        width = int(item_dimensions.width)
        depth = int(item_dimensions.depth)
        height = int(item_dimensions.height)
        
        #Try all possible orientations of the item
        orientations = [
            (width, depth, height),
            (width, height, depth),
            (depth, width, height),
            (depth, height, width),
            (height, width, depth),
            (height, depth, width)
        ]
        
        best_position = None
        best_score = float('inf')  #Lower is better
        
        for w, d, h in orientations:
            if (w > self.width or d > self.depth or h > self.height):
                continue
                
            for z in range(self.height - h + 1):
                for x in range(self.width - w + 1):
                    for y in range(self.depth - d + 1):
                        if self.is_region_empty(x, y, z, x+w, y+d, z+h):
                            #Score based on position (prefer lower, leftmost, deepest)
                            score = z * 10000 + x * 100 + y
                            if score < best_score:
                                best_score = score
                                best_position = Position(
                                    start_coordinates=Dimensions(width=float(x), depth=float(y), height=float(z)),
                                    end_coordinates=Dimensions(width=float(x+w), depth=float(y+d), height=float(z+h))
                                )
        
        return best_position
    
    def calculate_retrieval_steps(self, item_id: str) -> List[Dict]:
    
        #Calculate the steps needed to retrieve an item
        #Returns a list of steps, each step involving removing an item
    
        if item_id not in self.items:
            return []
        
        item = self.items[item_id]
        position = item.position
        
        if position is None:
            return []
        
        x1 = int(position.start_coordinates.width)
        y1 = int(position.start_coordinates.depth)
        z1 = int(position.start_coordinates.height)
        x2 = int(position.end_coordinates.width)
        y2 = int(position.end_coordinates.depth)
        z2 = int(position.end_coordinates.height)
        
        #If the item is directly accessible from the open face (y1 = 0)
        if y1 == 0:
            return []
        
        #Find blocking items
        blocking_items = set()
        for x in range(x1, x2):
            for z in range(z1, z2):
                for y in range(0, y1):
                    cell_item_id = self.grid[x][y][z]
                    if cell_item_id is not None and cell_item_id != item_id:
                        blocking_items.add(cell_item_id)
        
        #create retrieval steps
        steps = []
        for i, blocking_id in enumerate(blocking_items):
            blocking_item = self.items[blocking_id]
            steps.append({
                "step": i + 1,
                "action": "remove",
                "itemId": blocking_id,
                "itemName": blocking_item.name
            })
            
        #add step to retrieve the target item
        steps.append({
            "step": len(blocking_items) + 1,
            "action": "retrieve",
            "itemId": item_id,
            "itemName": item.name
        })
        
        #add steps to place back the blocking items
        for i, blocking_id in enumerate(blocking_items):
            blocking_item = self.items[blocking_id]
            steps.append({
                "step": len(blocking_items) + 2 + i,
                "action": "placeBack",
                "itemId": blocking_id,
                "itemName": blocking_item.name
            })
            
        return steps