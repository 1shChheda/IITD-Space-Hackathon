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
    occupied_volume: float = 0
    
    def calculate_total_volume(self) -> float:
        #Calculate the total volume of the container (multiplying all dimensions)
        return self.dimensions.width * self.dimensions.depth * self.dimensions.height
    
    def get_available_volume(self) -> float:
        #Calculate the available volume in the container
        return self.calculate_total_volume() - self.occupied_volume


class ContainerInDB(Container):
    #Container model as stored in the database
    _id: str


class ContainerCreate(BaseModel):
    #Model for creating a container
    container_id: str
    zone: str
    width: float
    depth: float
    height: float