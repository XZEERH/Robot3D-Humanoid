import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// --- Konfigurasi Dasar ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

// Tambahkan Fog (Kabut Sci-Fi)
scene.fog = new THREE.FogExp2(0x050510, 0.05);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 4);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimasi performa
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// --- Loading Manager ---
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');

const manager = new THREE.LoadingManager();
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    progressBar.style.width = `${progress}%`;
    loadingText.innerText = `Loading Neural Network: ${Math.round(progress)}%`;
};
manager.onLoad = () => {
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.style.display = 'none', 1000);
    }, 500);
};

// --- Lingkungan & Pencahayaan (Lighting) ---
// 1. Ambient Light (Cahaya dasar gelap)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// 2. Directional Light (Cahaya utama bersudut untuk bayangan)
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 25;
scene.add(dirLight);

// 3. Cahaya Neon Biru & Ungu (Sci-Fi Vibe)
const blueNeon = new THREE.PointLight(0x00d2ff, 10, 10);
blueNeon.position.set(-3, 2, -2);
scene.add(blueNeon);

const purpleNeon = new THREE.PointLight(0x8a2be2, 10, 10);
purpleNeon.position.set(3, 1, 2);
scene.add(purpleNeon);

// 4. Background Ruangan Sci-Fi (Bilik Gelap)
const roomGeo = new THREE.BoxGeometry(20, 10, 20);
const roomMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.BackSide
});
const room = new THREE.Mesh(roomGeo, roomMat);
room.position.y = 4;
scene.add(room);

// --- Model Robot ---
let robotModel = null;
let headBone = null;
let leftArmBone = null;
let rightArmBone = null;

// Fungsi membangun robot dummy jika file .glb tidak ada (Fallback System)
function createFallbackRobot() {
    console.warn("Membuat model robot prosedural karena robot.glb tidak ditemukan.");
    
    const matBody = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    const matJoint = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.5 });
    
    const robotGroup = new THREE.Group();
    
    // Torso (Tetap diam)
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const torso = new THREE.Mesh(torsoGeo, matBody);
    torso.position.y = 1.2;
    torso.castShadow = true;
    robotGroup.add(torso);

    // Kepala (Bone yang akan bergerak)
    headBone = new THREE.Group();
    headBone.position.set(0, 1.7, 0); // Posisi sendi leher
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMesh = new THREE.Mesh(headGeo, matBody);
    headMesh.position.y = 0.2; // Offset dari sendi leher
    headMesh.castShadow = true;
    headBone.add(headMesh);
    
    // Mata Menyala (LED)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    const eyeGeo = new THREE.PlaneGeometry(0.3, 0.05);
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    eyes.position.set(0, 0.2, 0.21);
    headBone.add(eyes);
    
    // Cahaya Mata memancar
    const eyeLight = new THREE.PointLight(0x00d2ff, 2, 2);
    eyeLight.position.set(0, 0.2, 0.3);
    headBone.add(eyeLight);
    
    robotGroup.add(headBone);

    // Lengan Kiri (Bone yang akan idle animation)
    leftArmBone = new THREE.Group();
    leftArmBone.position.set(-0.4, 1.5, 0); // Bahu kiri
    const armGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.7);
    const lArmMesh = new THREE.Mesh(armGeo, matBody);
    lArmMesh.position.y = -0.35;
    lArmMesh.castShadow = true;
    leftArmBone.add(lArmMesh);
    robotGroup.add(leftArmBone);

    // Lengan Kanan
    rightArmBone = new THREE.Group();
    rightArmBone.position.set(0.4, 1.5, 0); // Bahu kanan
    const rArmMesh = new THREE.Mesh(armGeo, matBody);
    rArmMesh.position.y = -0.35;
    rArmMesh.castShadow = true;
    rightArmBone.add(rArmMesh);
    robotGroup.add(rightArmBone);

    // Kaki (Tetap diam)
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8);
    const lLeg = new THREE.Mesh(legGeo, matBody);
    lLeg.position.set(-0.2, 0.4, 0);
    lLeg.castShadow = true;
    const rLeg = new THREE.Mesh(legGeo, matBody);
    rLeg.position.set(0.2, 0.4, 0);
    rLeg.castShadow = true;
    robotGroup.add(lLeg);
    robotGroup.add(rLeg);

    scene.add(robotGroup);
    robotModel = robotGroup;
    
    // Paksa loader selesai jika fallback digunakan
    manager.onLoad();
}

// Coba Load GLTF Model (jika user punya 'models/robot.glb')
const gltfLoader = new GLTFLoader(manager);
gltfLoader.load(
    './models/robot.glb',
    (gltf) => {
        robotModel = gltf.scene;
        
        // Setup shadow dan identifikasi Bone Rigging
        robotModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
            // Sesuaikan nama tulang (bone) ini dengan model Anda (Mixamo standard)
            if (child.isBone || child.name.toLowerCase().includes('head')) {
                if (child.name.toLowerCase().includes('head')) headBone = child;
                if (child.name.toLowerCase().includes('leftarm') || child.name.toLowerCase().includes('leftshoulder')) leftArmBone = child;
                if (child.name.toLowerCase().includes('rightarm') || child.name.toLowerCase().includes('rightshoulder')) rightArmBone = child;
            }
        });

        // Tambahkan efek mata menyala (LED Biru) pada kepala robot asli
        if (headBone) {
            const eyeLight = new THREE.PointLight(0x00d2ff, 5, 3);
            eyeLight.position.set(0, 0.1, 0.15); // Sesuaikan posisi mata
            headBone.add(eyeLight);
        }

        robotModel.position.set(0, 0, 0);
        scene.add(robotModel);
    },
    undefined,
    (error) => {
        // Jika gagal meload (karena file tidak ada), gunakan model prosedural
        createFallbackRobot();
    }
);

// --- Mouse Tracking & Parallax Interaksi ---
let mouse = new THREE.Vector2(0, 0);
let targetMouse = new THREE.Vector2(0, 0);

function onMouseMove(event) {
    // Normalisasi koordinat mouse (-1 hingga +1)
    targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('touchmove', (e) => {
    targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
});

// --- Animasi Frame Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Smooth Interpolation (Lerp) untuk pergerakan mouse
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    // 1. Animasi Kepala (Smooth Tracking)
    if (headBone) {
        // Rotasi kepala mengikuti arah mouse
        headBone.rotation.y = mouse.x * -0.8; // Kiri/Kanan
        headBone.rotation.x = mouse.y * 0.5;  // Atas/Bawah
    }

    // 2. Animasi Lengan Idle (Gerakan perlahan napas/mesin)
    if (leftArmBone) {
        leftArmBone.rotation.x = Math.sin(time * 1.5) * 0.05;
        leftArmBone.rotation.z = 0.2 + Math.sin(time * 1) * 0.02;
    }
    if (rightArmBone) {
        rightArmBone.rotation.x = Math.sin(time * 1.5 + Math.PI) * 0.05;
        rightArmBone.rotation.z = -0.2 - Math.sin(time * 1) * 0.02;
    }

    // 3. Efek Kamera Parallax Elegan
    camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.2 + 1.6 - camera.position.y) * 0.05;
    camera.lookAt(0, 1.2, 0); // Kamera selalu menatap dada/leher robot

    renderer.render(scene, camera);
}

// --- Responsive Resizer ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Mulai animasi
animate();