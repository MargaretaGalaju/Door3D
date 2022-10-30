import * as THREE from 'three';
import { ElementRef, Injectable, NgZone } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Image3DLoaderService } from './3d-image-loader.service';
import { first } from 'rxjs/operators';
import { frameArea } from '../../../shared/utils/utils.helper';
import { FacultyInfoService } from '../faculty-info.service';
import { MathUtils, Vector3 } from 'three';
import { Faculty } from 'src/app/shared/models/faculty.model';
import { LoadingService } from '../loading.service';
import { ManerPositions } from 'src/app/features/home/components/faculty-details/faculty-details.component';
import { addAmbientLight, addDirectionalLight } from '../helpers/light.helper';


enum Positions {
  right, left, top, bottom
}
@Injectable()
export class EngineService {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  private cameraFrustrum = 45;

  public controls: OrbitControls;
  public manager = new THREE.LoadingManager();
  public isLoading = true;
  public frameId: number = null;

  public buildings: THREE.Object3D<THREE.Event>[] = [];
  public faculties: Faculty[] = [];

  public mouse: THREE.Vector2;
  public raycaster: THREE.Raycaster;

  public initialCameraPositions: Vector3;
  public translatedCameraPositions: Vector3;
  public translatedBackCameraPositions: Vector3;
  spotLightFront;
  spotLightBack;

  public elementToChange;
  public isRecommendationsPage: boolean;
  // Fereastra
  carcasa; 
  public additionalWindowTop;
  public additionalWindowRight;
  windowHeight;
  windowWidth;

  buttons = [];

  addedWindows = [];

  doorOpened: boolean;
  doorOpeningInProgress: boolean = false;
  
  initPositions;

  manerInProgress;
  manerDegrees =0;
  maner;

  usaIntreaga:any[] = [];
  
  groupDoor = new THREE.Group();
  doorRotationAxis;
  rad=0;
  leftRama;
  rightRama;
  topRama;
  initLeftPosition;
  initRightPosition;
  widthCoefficient = 40;
  scaleWidthCoefficient;
  scaleRamaHeightCoefficient;
  scaleFoaieHeightCoefficient;
  initialDoorWidth;
  doorWidth;
  doorHeight;
  manere = []
  heightExtendableParts = [];
  widthExtendableParts: {obj: any, scaleCoefficient: any}[] = [];
  notExtendableWidth=0;
  openingPosition: 'right' | 'left' = 'right';
  openingSide: 'inside' | 'outside' = 'outside';

  pereteSus;
  pereteLeft;
  pereteRight;
  
  constructor(
    private readonly ngZone: NgZone,
    private readonly facultyInfoService: FacultyInfoService,
    private readonly objectLoader: Image3DLoaderService,
    private readonly loadingService: LoadingService,
  ) {  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>, isRecommendationsPage?:boolean): void {
    this.canvas = canvas.nativeElement;
    this.isRecommendationsPage = isRecommendationsPage;
    
    this.initSceneConfigurations();
    
    this.addDoor();
    this.addGround();
    this.render();
    this.animate();

    this.loadingService.stopLoading();
  }

  public initSceneConfigurations(): void {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    // this.renderer.domElement.addEventListener('click', this.onMouseDown.bind(this));
    
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true;

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.update();
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI/2;
    
    addAmbientLight(this.scene);
    addDirectionalLight(this.scene);
    this.toggleSpotLight(false);
  }

  public toggleDoorOpening() {
    if (this.doorOpeningInProgress) {
      return;
    }

    if (!this.doorOpened) {
      const temporaryGroup = new THREE.Group();
      const leftRama = this.scene.getObjectByName(this.leftRama.name);
      const rightRama = this.scene.getObjectByName(this.rightRama.name);
      
      const usedAxisPosition = this.openingPosition === 'right' ? rightRama.position.x : leftRama.position.x;
      this.doorRotationAxis = new THREE.Vector3(0,usedAxisPosition,0).normalize();

      this.usaIntreaga.forEach((i) => {
        const itemDinUsa = this.scene.getObjectByName(i.name);
        temporaryGroup.add(itemDinUsa.clone());
        itemDinUsa.removeFromParent()
      });

      this.groupDoor.removeFromParent();
      this.groupDoor = new THREE.Group()
      
      temporaryGroup.position.set(usedAxisPosition, 0 , 0);
      this.groupDoor.position.set(-usedAxisPosition, 0 , 0);
      this.groupDoor.add(temporaryGroup);
      this.scene.add(this.groupDoor)
      
      this.doorOpeningInProgress = true;
    } else if (this.doorOpened) {
      this.doorOpeningInProgress = true;
    }
  }

  public addGround() {
    const groundTexture = new THREE.TextureLoader().load('assets/textures/grass.jpg');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping   
    groundTexture.repeat.set( 50, 50 )
    groundTexture.anisotropy = 16
    const groundMaterial = new THREE.MeshLambertMaterial({   
      map: groundTexture 
    });

    const groundGeometry = new THREE.PlaneGeometry( 20000, 20000 ) 
    const ground = new THREE.Mesh( groundGeometry, groundMaterial ) 
    ground.rotation.x = -Math.PI/2;
    ground.position.set(0,-25,0);
    this.scene.add(ground)
    this.renderer.setClearColor(new THREE.Color(0xcce0ff));
    this.scene.fog = new THREE.Fog( 0xcce0ff, 2500, 10000);
  }

  public animate(): void {
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }
    });
  }
    
  public culoareaManeruluiChange(color: string) {
    this.manere.forEach((item) => {
      if (item) {
        item.material = item.material.clone();
        item.material.color.set(color);
      }
    });
  }

  culoareaRameiChange(color) {
    const items = ['RamaStanga','RamaDreapta','RamaSus'];
    
    items.forEach((item) => {
      const object: any =  this.scene.getObjectByName(item);

      if (object) {
        object.material = object.material.clone();
        object.material.color.set(color);
        object.material.map = null;
      }
    });
  }

  public culoareaFerestreiChange(color: string) {
    const items = ['FoaieDreapta', 'FoaieStanga'];
    
    items.forEach((item) => {
      const object: any =  this.scene.getObjectByName(item);

      if (object) {
        object.material = object.material.clone();
        object.material.color = new THREE.Color(color);

        object.material.map = null;
      }
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    if (this.doorOpeningInProgress) {
      if (!this.doorOpened) {
        this.rad = this.rad - 0.01;
    
        if (this.rad >= -2) {
          this.groupDoor.rotateOnAxis(this.doorRotationAxis, this.openingSide==='inside' ? -0.01 : 0.01)
        } else {
          this.doorOpeningInProgress = false;
          this.doorOpened = true;
        }
      } else {
        this.rad = this.rad + 0.01;
        
        if (this.rad < 0) {
          this.groupDoor.rotateOnAxis(this.doorRotationAxis, this.openingSide==='inside' ? 0.01 : -0.01)
        } else {
          this.doorOpeningInProgress = false;
          this.doorOpened = false;
          this.rad = 0;
        }
      }
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      cancelAnimationFrame(this.frameId)
    }
  }

  public toggleUIControls(enableFullNavigation: boolean): void {
    if (enableFullNavigation) {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI;

      this.controls.minAzimuthAngle = 0;
      this.controls.maxAzimuthAngle = Math.PI;
    } else {
      this.controls.minPolarAngle = Math.PI / 3.25;
      this.controls.maxPolarAngle = Math.PI / 3;

      this.controls.minAzimuthAngle = Math.PI / 6;
      this.controls.maxAzimuthAngle = Math.PI / 3;
    }
  }

  public onOpeningChange(event) {
    if (this.doorOpened) {
     this.closeDoor();
    }

    this.openingPosition = event;

    this.manere.forEach((i) => {
      const item = this.scene.getObjectByName(i.name);

      item.position.x = -item.position.x
    });
  }

  public onOpeningSideChange(value) {
    if (this.doorOpened) {
      this.closeDoor();
    }

    this.openingSide = value;
  }

  public closeDoor() {
    const leftRama = this.scene.getObjectByName(this.leftRama.name);
    const rightRama = this.scene.getObjectByName(this.rightRama.name);
    const usedAxisPosition = this.openingPosition === 'right' ? rightRama.position.x : leftRama.position.x;
    this.doorRotationAxis = new THREE.Vector3(0, usedAxisPosition, 0).normalize();
    const rotationConstant = this.openingSide === 'inside' ? 2 : -2;
    this.groupDoor.rotateOnAxis(this.doorRotationAxis, rotationConstant);
    this.rad = 0;

    this.doorOpened = false;
  }

  public onDoorHeightChange(newDoorHeight) {
    if (this.doorOpened) {
      this.closeDoor();
    }

    const leftRama = this.scene.getObjectByName(this.leftRama.name);
    const rightRama = this.scene.getObjectByName(this.rightRama.name);
    const topRama = this.scene.getObjectByName(this.topRama.name);

    if (this.doorHeight !== newDoorHeight) {
      leftRama.scale.setZ(this.scaleRamaHeightCoefficient*newDoorHeight);
      rightRama.scale.setZ(this.scaleRamaHeightCoefficient*newDoorHeight);

      const rightRamaHeight = new THREE.Box3().setFromObject(rightRama).getSize(new THREE.Vector3()).y;
      const topRamaHeight = new THREE.Box3().setFromObject(topRama).getSize(new THREE.Vector3()).y;
      topRama.position.y = rightRamaHeight-topRamaHeight;

      this.pereteSus.constant = -newDoorHeight-7;

      this.heightExtendableParts.forEach((f) => {
        const foaie = this.scene.getObjectByName(f.name);

        foaie.scale.setZ(this.scaleFoaieHeightCoefficient*(newDoorHeight+2));
      });

      this.manere.forEach((i) => {
        const item = this.scene.getObjectByName(i.name);

        item.position.y = newDoorHeight/2
      });
    }
  }
  
  public toggleSpotLight( hideSpotlight) {
    if (hideSpotlight) {
      this.spotLightFront.removeFromParent();
      this.spotLightBack.removeFromParent();
    } else {
      const spotLightFront = new THREE.SpotLight(0xffa95c, 1);
      spotLightFront.castShadow = true;
      spotLightFront.position.set(200, 250, 200);
      spotLightFront.shadow.bias = -0.0001;
      spotLightFront.shadow.mapSize.width = 1024*4;
      spotLightFront.shadow.mapSize.height = 1024*4;
      this.spotLightFront = spotLightFront;
  
      this.scene.add(spotLightFront);
  
      let spotLightBack = spotLightFront.clone();
      spotLightBack.intensity = 0.5;
      spotLightBack.position.set(200, 250,-200)
      this.scene.add(spotLightBack)
      this.spotLightBack = spotLightBack;
    }
  }

  public switchView(frontView) {
    this.setCameraPosition(this.scene.getObjectByName('casa'), frontView);
  }
  
  public onDoorWidthChange(newDoorWidth) {
    if (this.doorOpened) {
      this.closeDoor();
    }

    const leftRama = this.scene.getObjectByName(this.leftRama.name);
    const rightRama = this.scene.getObjectByName(this.rightRama.name);
    const topRama = this.scene.getObjectByName(this.topRama.name);
    const rightRamaWidth = new THREE.Box3().setFromObject(rightRama).getSize(new THREE.Vector3()).x;

    console.log(this.doorHeight, this.doorWidth);
    
    if (this.doorWidth !== newDoorWidth) {
      leftRama.position.x = newDoorWidth/2-rightRamaWidth;
      rightRama.position.x = -(newDoorWidth/2-rightRamaWidth);
      this.doorWidth = newDoorWidth;
      this.pereteLeft.constant = -newDoorWidth/2;
      this.pereteRight.constant = -newDoorWidth/2;
      
      topRama.scale.setX(this.scaleWidthCoefficient*newDoorWidth);

      this.widthExtendableParts.forEach((f) => {
        const foaie = this.scene.getObjectByName(f.obj.name);

        foaie.scale.setX(f.scaleCoefficient*((newDoorWidth-this.notExtendableWidth)/2));
      });

      this.manere.forEach((i) => {
        const item = this.scene.getObjectByName(i.name);

        if (item.name === 'Broasca') {
          item.position.x = this.openingPosition === 'right' ? -(newDoorWidth/2-rightRamaWidth-5): (newDoorWidth/2-rightRamaWidth-5)
        }
        
        if (item.name === 'Maner') {
          item.position.x = this.openingPosition === 'right' ? -(newDoorWidth/2-rightRamaWidth-15): (newDoorWidth/2-rightRamaWidth-15)
        }
      });
    }
  }

  public addDoor() {
    this.renderer.localClippingEnabled = true;

    this.objectLoader.getFBXObject(`assets/usa/full-redenumit.fbx`).pipe(first()).subscribe((obj) => {
      this.scene.add(obj);
      obj.name = 'casa';

      obj?.traverse((child) => {
        if (child.name.includes('RamaStanga')) {
          child.name = 'RamaStanga';
          this.leftRama = child;
          
          this.initLeftPosition = this.leftRama.position.x;
        }

        if (child.name.includes('RamaDreapta')) {
          this.rightRama = child;
          this.initRightPosition = this.rightRama.position.x;
        }

        if (child.name.includes('RamaSus')) {
          this.topRama = child;
          
          const boxtopRama = new THREE.Box3().setFromObject(this.topRama);
          const boxSizetopRama = boxtopRama.getSize(new THREE.Vector3());
          this.scaleWidthCoefficient = this.topRama.scale.x/boxSizetopRama.x;
        }

        if (child.name.includes('Rama')) {
          child.material = child.material.clone();
          child.material.color.set(0x000000);
        }

        if (child.name.includes('Broasca')) {
          this.manere.push(child)
          this.usaIntreaga.push(child);
        }
        
        if (child.name.includes('Maner')) {
          this.manere.push(child)
          this.usaIntreaga.push(child)
        }

        if (child.name.includes('FoaieDreapta')) {
          this.heightExtendableParts.push(child);
          this.usaIntreaga.push(child)
  
          const foaieBoxSize = new THREE.Box3().setFromObject(child).getSize(new THREE.Vector3());
          this.widthExtendableParts.push({
            obj: child,
            scaleCoefficient: child.scale.x/foaieBoxSize.x,
          });
        }
        
        if (child.name.includes('FoaieStanga')) {
          const foaieBoxSize = new THREE.Box3().setFromObject(child).getSize(new THREE.Vector3());

          this.heightExtendableParts.push(child);
          this.widthExtendableParts.push({
            obj: child,
            scaleCoefficient: child.scale.x/foaieBoxSize.x,
          });
          this.usaIntreaga.push(child)
          
          this.scaleFoaieHeightCoefficient = child.scale.y/foaieBoxSize.y;
        }

        if (child.name.includes('Sticla')) {
          child.name = 'Sticla';

          const material = new THREE.MeshPhysicalMaterial({  
            roughness: 0,  
            transmission: 1,
          });
          child.material = material;
          this.heightExtendableParts.push(child)
          this.usaIntreaga.push(child)
        }

        child.receiveShadow = true;
      });

      const box = new THREE.Box3().setFromObject(obj);
      const boxSize = box.getSize(new THREE.Vector3());
      const boxCenter = box.getCenter(new THREE.Vector3());
      frameArea(boxSize.length() * 0.5, boxSize.length(), boxCenter, this.camera, this.cameraFrustrum, true);

      this.windowHeight = boxSize.y;
      this.windowWidth = boxSize.x;
     
      this.doorRotationAxis = new THREE.Vector3(0,0,this.initRightPosition).normalize();;
      
      const ramaWidth = new THREE.Box3().setFromObject(this.scene.getObjectByName('RamaStanga')).getSize(new THREE.Vector3()).x;

      this.doorWidth = Number((this.initLeftPosition - this.initRightPosition + 2*ramaWidth).toFixed(0));
      this.doorHeight = Number((this.topRama.position.y).toFixed(0));

      this.calculateNotExtendableWidth(['RamaStanga', 'RamaDreapta', 'Sticla']);

      this.scaleRamaHeightCoefficient = this.rightRama.scale.y/this.doorHeight;

      this.controls.maxDistance = boxSize.length() * 10;
      this.controls['target'].copy(boxCenter);
      this.controls.update();

      this.cutFromPerete();
    });
  }

  public setCameraPosition(lookedObject, frontView) {
    const box = new THREE.Box3().setFromObject(lookedObject);
    const boxSize = box.getSize(new THREE.Vector3());
    const boxCenter = box.getCenter(new THREE.Vector3());
    frameArea(boxSize.length() * 0.5, boxSize.length(), boxCenter, this.camera, this.cameraFrustrum, frontView);
  }

  public cutFromPerete() {
    const pereti = [
      {
        plane: new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), this.topRama.position.y+7),
        name: 'PereteSus',
      },
      {
        name:  'PereteStanga',
        plane: new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), this.initLeftPosition+7)
      },
      {
        name: 'PereteDreapta',
        plane: new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), this.initLeftPosition+7)
      }
    ];

    this.pereteSus = pereti[0].plane;
    this.pereteLeft = pereti[1].plane;
    this.pereteRight = pereti[2].plane;

    pereti.forEach((perete) => {
      let planes = [
        perete.plane,
      ];

      planes[0].negate()

      const material = new THREE.MeshStandardMaterial({
        color: 0xA0938D,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes,
        clipShadows: true,
        shadowSide: THREE.DoubleSide,
      });

      const pereteObj: any = this.scene.getObjectByName(perete.name);
      
      pereteObj.material = material;
    });
  }

  
  public calculateNotExtendableWidth(staticWidthObjects: any[]) {
    staticWidthObjects.forEach(el => {
      const boxSize = new THREE.Box3().setFromObject(this.scene.getObjectByName(el)).getSize(new THREE.Vector3());
      this.notExtendableWidth = this.notExtendableWidth + boxSize.x;
    });
  }

  public onTextureChange(loadedTexture) {
    const items = ['FoaieDreapta','FoaieStanga'];
    
    items.forEach((item) => {
      const object: any =  this.scene.getObjectByName(item);

      if (object) {
        const material = new THREE.MeshBasicMaterial({
          map: loadedTexture,
        });

        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(0.5, 0.5);
        // floorTx.repeat.set(meshWidth / textureWidth, meshHeight / textureHeight);

        object.material = material
      }
    });
  }
}
