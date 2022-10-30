import { Injectable } from '@angular/core';
import { Observable, Observer, of } from 'rxjs';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
@Injectable({
  providedIn: 'root'
})
export class Image3DLoaderService {
  public GLTFloader: GLTFLoader;
  public fbxLoader: FBXLoader;
  public objLoader: OBJLoader;
  

  constructor() { 
    this.GLTFloader = new GLTFLoader();
    this.fbxLoader  = new FBXLoader()
    this.objLoader  = new OBJLoader()

  }

  public getGLTFObject(gltfPath: string): Observable<GLTF> {
    return new Observable((observer: Observer<GLTF>) => {
      this.GLTFloader.load(gltfPath, (gltf) => {
        observer.next(gltf);
        observer.complete();
      });
    });
  }

  
  public getFBXObject(FBXPath: string): Observable<any> {
    return new Observable((observer: Observer<any>) => {
      this.fbxLoader.load(FBXPath, (FBX) => {
        observer.next(FBX);
        observer.complete();
      });
    });
  }

  public getObjObject(FBXPath: string): Observable<any> {
    return new Observable((observer: Observer<any>) => {
      this.objLoader.load(FBXPath, (FBX) => {
        observer.next(FBX);
        observer.complete();
      });
    });
  }
}
