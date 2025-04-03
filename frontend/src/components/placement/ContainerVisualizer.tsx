import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Alert, Button, Popper, Paper } from '@mui/material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Container } from '../../types/Container';
import { Item } from '../../types/Item';
import { placeItem } from '../../services/placementService';
import { getPlacementSuggestion } from '../../services/placementService';
import { stringToColor, priorityToColor } from '../../utils/colors';
import { PlacementPosition } from '../../types/Placement';

interface ContainerVisualizerProps {
    container: Container;
    placedItems: Item[];
    selectedItem: Item | null;
    onRefresh: () => void;
}

interface ItemMeshData {
    mesh: THREE.Mesh;
    item: Item;
}

//to generate distinct colors for items
const generateDistinctColor = (index: number, total: number): string => {
    //usingg HSL to ensure colors are visually distinct
    const hue = (index * (360 / Math.max(total, 12))) % 360;
    return `hsl(${hue}, 70%, 60%)`;
};

const ContainerVisualizer: React.FC<ContainerVisualizerProps> = ({
    container,
    placedItems,
    selectedItem,
    onRefresh
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [suggestedPosition, setSuggestedPosition] = useState<PlacementPosition | null>(null);
    const [isPlacing, setIsPlacing] = useState<boolean>(false);
    const ghostMeshRef = useRef<THREE.Mesh | null>(null);
    const itemMeshesRef = useRef<ItemMeshData[]>([]);
    const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
    const [showItemDetails, setShowItemDetails] = useState(false);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    //Setup 3D scene
    useEffect(() => {
        if (!mountRef.current) return;

        //initialize scene, camera, and renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight || 600;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(container.dimensions.width * 1.5, container.dimensions.height * 1.5, container.dimensions.depth * 1.5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        //OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        //lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(container.dimensions.width * 2, container.dimensions.height * 2, container.dimensions.depth * 2);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Clean up DOM element
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);

        //Grid helper
        const gridHelper = new THREE.GridHelper(
            Math.max(container.dimensions.width, container.dimensions.depth) * 2,
            20,
            0x555555,
            0xDDDDDD
        );
        gridHelper.position.y = -0.01; // Just below the container
        scene.add(gridHelper);

        //event-listeners for RAYCASTING
        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current) return;

            const rect = mountRef.current.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;

            setMousePosition({ x: event.clientX, y: event.clientY });
        };

        const onClick = () => {
            if (hoveredItem) {
                setShowItemDetails(!showItemDetails);
            } else {
                setShowItemDetails(false);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        mountRef.current.addEventListener('click', onClick);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();

            // Raycasting for hover effects
            if (sceneRef.current && cameraRef.current && itemMeshesRef.current.length > 0) {
                raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
                const intersects = raycasterRef.current.intersectObjects(
                    itemMeshesRef.current.map(data => data.mesh),
                    false
                );

                // Reset all materials
                itemMeshesRef.current.forEach(itemData => {
                    const material = itemData.mesh.material as THREE.MeshLambertMaterial;
                    material.emissive.set(0x000000);
                });

                if (intersects.length > 0) {
                    const selectedObject = intersects[0].object as THREE.Mesh;
                    const itemData = itemMeshesRef.current.find(data => data.mesh === selectedObject);

                    if (itemData) {
                        // Highlight the hovered item
                        const material = selectedObject.material as THREE.MeshLambertMaterial;
                        material.emissive.set(0x333333);
                        setHoveredItem(itemData.item);
                        setAnchorEl(mountRef.current);
                    }
                } else {
                    if (!showItemDetails) {
                        setHoveredItem(null);
                        setAnchorEl(null);
                    }
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight || 600;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Clean up on unmount
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeEventListener('click', onClick);
                mountRef.current.innerHTML = '';
            }
            scene.clear();
            renderer.dispose();
        };
    }, []);

    //update scene when container or items change
    useEffect(() => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

        const scene = sceneRef.current;

        // Clear previous objects
        scene.clear();
        itemMeshesRef.current = [];

        //adding lights again after clearing
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(container.dimensions.width * 2, container.dimensions.height * 2, container.dimensions.depth * 2);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        //grid helper
        const gridHelper = new THREE.GridHelper(
            Math.max(container.dimensions.width, container.dimensions.depth) * 2,
            20,
            0x555555,
            0xDDDDDD
        );
        gridHelper.position.y = -0.01; // just below the container
        scene.add(gridHelper);

        //create container visualization
        const containerGeometry = new THREE.BoxGeometry(
            container.dimensions.width,
            container.dimensions.height,
            container.dimensions.depth
        );

        //Create wireframe material
        const edges = new THREE.EdgesGeometry(containerGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const containerWireframe = new THREE.LineSegments(edges, lineMaterial);

        //Create transparent container
        const containerMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.1
        });
        const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);

        //Position container so its bottom is at y=0 and it's centered in x and z
        containerMesh.position.set(
            container.dimensions.width / 2,
            container.dimensions.height / 2,
            container.dimensions.depth / 2
        );
        containerWireframe.position.copy(containerMesh.position);

        scene.add(containerMesh);
        scene.add(containerWireframe);

        //add all placed items with distinct colors
        placedItems.forEach((item, index) => {
            if (item.position) {
                const width = item.position.end_coordinates.width - item.position.start_coordinates.width;
                const height = item.position.end_coordinates.height - item.position.start_coordinates.height;
                const depth = item.position.end_coordinates.depth - item.position.start_coordinates.depth;

                const itemGeometry = new THREE.BoxGeometry(width, height, depth);

                const itemColor = generateDistinctColor(index, placedItems.length);
                const itemMaterial = new THREE.MeshLambertMaterial({
                    color: new THREE.Color(itemColor),
                    transparent: true,
                    opacity: 0.8
                });

                const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);

                //Position item at its start coordinates plus half its dimensions
                itemMesh.position.set(
                    item.position.start_coordinates.width + width / 2,
                    item.position.start_coordinates.height + height / 2,
                    item.position.start_coordinates.depth + depth / 2
                );

                // Store reference to mesh and corresponding item
                itemMeshesRef.current.push({ mesh: itemMesh, item });
                scene.add(itemMesh);

                // Add item label
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.width = 256;
                    canvas.height = 128;
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '24px Arial';
                    context.fillStyle = '#000000';
                    context.textAlign = 'center';
                    context.fillText(item.item_id, canvas.width / 2, 40);
                    context.font = '18px Arial';
                    context.fillText(item.name, canvas.width / 2, 70);

                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                    const sprite = new THREE.Sprite(spriteMaterial);
                    sprite.position.copy(itemMesh.position);
                    sprite.position.y += height / 2 + 0.5;
                    sprite.scale.set(2, 1, 1);
                    scene.add(sprite);
                }
            }
        });

        //Update camera position
        const cameraDistance = Math.max(
            container.dimensions.width,
            container.dimensions.height,
            container.dimensions.depth
        ) * 1.7;

        cameraRef.current.position.set(cameraDistance, cameraDistance, cameraDistance);
        cameraRef.current.lookAt(
            container.dimensions.width / 2,
            container.dimensions.height / 2,
            container.dimensions.depth / 2
        );

        //update renderer size
        if (mountRef.current) {
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight || 600;
            rendererRef.current.setSize(width, height);
        }

    }, [container, placedItems]);

    //get suggested position when a new item is selected
    useEffect(() => {
        if (selectedItem && !selectedItem.container_id) {
            setIsPlacing(true);
            getPlacementSuggestion(selectedItem.item_id)
                .then(response => {
                    if (response.success && response.suggestion) {
                        if (response.suggestion.containerId === container.container_id) {
                            setSuggestedPosition(response.suggestion.position);

                            // IMP! Create ghost mesh for suggested position
                            if (sceneRef.current) {
                                //remove previous ghost mesh if exists
                                if (ghostMeshRef.current) {
                                    sceneRef.current.remove(ghostMeshRef.current);
                                    ghostMeshRef.current = null;
                                }

                                const width = response.suggestion.position.endCoordinates.width -
                                    response.suggestion.position.startCoordinates.width;
                                const height = response.suggestion.position.endCoordinates.height -
                                    response.suggestion.position.startCoordinates.height;
                                const depth = response.suggestion.position.endCoordinates.depth -
                                    response.suggestion.position.startCoordinates.depth;

                                const ghostGeometry = new THREE.BoxGeometry(width, height, depth);
                                const ghostMaterial = new THREE.MeshLambertMaterial({
                                    color: 0x4CAF50,
                                    transparent: true,
                                    opacity: 0.5
                                });

                                const ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial);
                                ghostMesh.position.set(
                                    response.suggestion.position.startCoordinates.width + width / 2,
                                    response.suggestion.position.startCoordinates.height + height / 2,
                                    response.suggestion.position.startCoordinates.depth + depth / 2
                                );

                                sceneRef.current.add(ghostMesh);
                                ghostMeshRef.current = ghostMesh;
                            }
                        } else {
                            setSuggestedPosition(null);
                        }
                    } else {
                        setSuggestedPosition(null);
                    }
                    setIsPlacing(false);
                })
                .catch(err => {
                    console.error('Failed to get placement suggestion:', err);
                    setError('Failed to get placement suggestion');
                    setIsPlacing(false);
                });
        } else {
            setSuggestedPosition(null);

            //remove ghost mesh if exists
            if (sceneRef.current && ghostMeshRef.current) {
                sceneRef.current.remove(ghostMeshRef.current);
                ghostMeshRef.current = null;
            }
        }
    }, [selectedItem, container.container_id]);

    const handleItemPlacement = async () => {
        if (!selectedItem || !suggestedPosition) return;

        try {
            setIsPlacing(true);
            await placeItem(
                selectedItem.item_id,
                container.container_id,
                {
                    start_coordinates: suggestedPosition.startCoordinates,
                    end_coordinates: suggestedPosition.endCoordinates
                }
            );

            // Refresh data after placing
            onRefresh();

            //Clear suggested position and ghost mesh
            setSuggestedPosition(null);
            if (sceneRef.current && ghostMeshRef.current) {
                sceneRef.current.remove(ghostMeshRef.current);
                ghostMeshRef.current = null;
            }

            setIsPlacing(false);
        } catch (err) {
            console.error('Failed to place item:', err);
            setError('Failed to place item');
            setIsPlacing(false);
        }
    };

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box
                ref={mountRef}
                sx={{
                    width: '100%',
                    height: '600px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            />

            {/* Item details popper */}
            <Popper
                open={Boolean(hoveredItem) && (showItemDetails || Boolean(hoveredItem && !showItemDetails))}
                anchorEl={anchorEl}
                placement="top"
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 10],
                        },
                    },
                ]}
                style={{
                    zIndex: 1200,
                    pointerEvents: 'none',
                    left: mousePosition?.x,
                    top: mousePosition?.y,
                    position: 'fixed',
                    transform: 'translate(-50%, -100%)'
                }}
            >
                {hoveredItem && (
                    <Paper sx={{ p: 2, maxWidth: 300, boxShadow: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {hoveredItem.name}
                        </Typography>
                        <Typography variant="body2">
                            <strong>ID:</strong> {hoveredItem.item_id}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Dimensions:</strong> {hoveredItem.dimensions.width} × {hoveredItem.dimensions.depth} × {hoveredItem.dimensions.height} cm
                        </Typography>
                        <Typography variant="body2">
                            <strong>Weight:</strong> {hoveredItem.mass} kg
                        </Typography>
                        {hoveredItem.priority && (
                            <Typography variant="body2">
                                <strong>Priority:</strong> {hoveredItem.priority}
                            </Typography>
                        )}
                        {hoveredItem.expiry_date && (
                            <Typography variant="body2">
                                <strong>Expiry:</strong> {hoveredItem.expiry_date}
                            </Typography>
                        )}
                    </Paper>
                )}
            </Popper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">
                    {container.container_id} - {container.zone}
                </Typography>

                {selectedItem && suggestedPosition && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleItemPlacement}
                        disabled={isPlacing}
                    >
                        Place {selectedItem.name}
                    </Button>
                )}
            </Box>

            <Typography variant="body2" color="text.secondary">
                Container dimensions: {container.dimensions.width}×{container.dimensions.depth}×{container.dimensions.height} cm
            </Typography>

            <Typography variant="body2" color="text.secondary">
                Items placed: {placedItems.length} (Hover over items to see details)
            </Typography>
        </Box>
    );
};

export default ContainerVisualizer;