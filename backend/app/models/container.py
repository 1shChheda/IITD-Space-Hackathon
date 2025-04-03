from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class Dimensions(BaseModel):
    width: float
    depth: float
    height: float
    
class Container(BaseModel):
    container_id: str
    zone: str
    dimensions: Dimensions
    occupied_volume: float = 0.0

    def calculate_total_volume(self) -> float:
        #Calculate the total volume of the container (multiplying all dimensions)
        return self.dimensions.width * self.dimensions.depth * self.dimensions.height
    
    def get_available_volume(self) -> float:
        #Calculate available volume in the container
        total_volume = self.dimensions.width * self.dimensions.depth * self.dimensions.height
        return total_volume - self.occupied_volume
    
    def get_utilization_percentage(self) -> float:
        #Calculate utilization percentage
        total_volume = self.dimensions.width * self.dimensions.depth * self.dimensions.height
        if total_volume == 0:
            return 0
        return (self.occupied_volume / total_volume) * 100

class ContainerCreate(BaseModel):
    container_id: str
    zone: str
    width: float
    depth: float
    height: float