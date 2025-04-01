import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
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

    //Setup 3D scene
    useEffect(() => {
        if (!mountRef.current) return;

        //initialize scene, camera, and renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        const width = mountRef.current.clientWidth;
        const height = 500; //NOTE: Fixed height for visualization

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

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Clean up on unmount
        return () => {
            scene.clear();
            renderer.dispose();
            if (mountRef.current) {
                mountRef.current.innerHTML = '';
            }
        };
    }, []);

    //update scene when container or items change
    useEffect(() => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

        const scene = sceneRef.current;

        // Clear previous objects
        scene.clear();

        //adding lights again after clearing
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(container.dimensions.width * 2, container.dimensions.height * 2, container.dimensions.depth * 2);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Grid helper
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

        // Add all placed items
        placedItems.forEach(item => {
            if (item.position) {
                const width = item.position.end_coordinates.width - item.position.start_coordinates.width;
                const height = item.position.end_coordinates.height - item.position.start_coordinates.height;
                const depth = item.position.end_coordinates.depth - item.position.start_coordinates.depth;

                const itemGeometry = new THREE.BoxGeometry(width, height, depth);
                const itemColor = stringToColor(item.item_id);
                const itemMaterial = new THREE.MeshLambertMaterial({
                    color: itemColor,
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
        ) * 2;

        cameraRef.current.position.set(cameraDistance, cameraDistance, cameraDistance);
        cameraRef.current.lookAt(
            container.dimensions.width / 2,
            container.dimensions.height / 2,
            container.dimensions.depth / 2
        );

        //update renderer size
        if (mountRef.current) {
            const width = mountRef.current.clientWidth;
            const height = 500; // Fixed height
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
        <Box sx={{ width: '100%' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box
                ref={mountRef}
                sx={{
                    width: '100%',
                    height: '500px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            />

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

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Container dimensions: {container.dimensions.width}×{container.dimensions.depth}×{container.dimensions.height} cm
            </Typography>

            <Typography variant="body2" color="text.secondary">
                Items placed: {placedItems.length}
            </Typography>
        </Box>
    );
};

export default ContainerVisualizer;