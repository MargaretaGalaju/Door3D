import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { FacultyIdEnum } from 'src/app/core/constants/faculty-id.enum';
import { RouteEnum } from 'src/app/core/routes/routes.enum';
import { EngineService } from 'src/app/core/services/3d-map/engine.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { FacultyApiService } from 'src/app/core/services/faculty-api.service';
import { FacultyInfoService } from 'src/app/core/services/faculty-info.service';
import { listAnimationFast, slideInOutAnimation } from 'src/app/shared/animations/animations';
import * as THREE from 'three';

export enum ManerPositions {
  top,
  topMiddle,
  middle,
  bottomMiddle,
  bottom,
}

@Component({
  selector: 'app-door-config-sidebar',
  templateUrl: './faculty-details.component.html',
  styleUrls: ['./faculty-details.component.scss'],
  animations: [
    slideInOutAnimation,
    listAnimationFast,
  ],
  encapsulation: ViewEncapsulation.None
})
export class FacultyDetailsComponent implements OnInit {
  public activeFaculty$ = this.facultyInfoService.activeFaculty$;
  public activeSpecialtyId: number;
  public showAnimation = false;
  public currentFavSpecialty: string;
  public selectedManerPosition;
  ManerPositionsEnum = ManerPositions
  public manerPositions = Object.keys(ManerPositions).filter((item) => !isNaN(+item));
  textura;
  doorWidth = 1090;
  doorHeight = 2020;
  selectedTexture;

  public texturi = [
    'assets/usa/textures/wood.jpeg',
  ];

  public frontView = true;

  public isAuthentificated(): boolean {
    return this.authService.isAuthenticated();
  }

  public get readonly() {
    return this.engineService.doorOpeningInProgress;
  }

  public doorWidthLimit = {
    min: 700,
    max: 2000
  }

  public doorHeightLimit = {
    min: 1850,
    max: 2500
  }
  
  constructor(
    private readonly authService: AuthService,
    private readonly engineService: EngineService,
    private readonly facultyInfoService: FacultyInfoService,
    private readonly facultyApiService: FacultyApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.activeFaculty$.subscribe((faculty) => {
      if (!faculty) {
        return;
      }

      this.activeSpecialtyId = null;
      faculty.specialties = [...faculty.specialties]
    });

    combineLatest([
      this.activeFaculty$,
      this.facultyApiService.getAllFavorites(),
    ]).subscribe(([faculty, favorites]) => {
      if (!faculty) {
        return;
      }

      this.activeSpecialtyId = null;
      faculty.specialties = [...faculty.specialties].map((specialty) => ({...specialty, isFavorite: favorites?.some((f=> f.id === specialty.id))}))
    });

    const loader = new THREE.TextureLoader();
    this.textura = loader.load(this.texturi[0]);
  }

  public makeVirtualTour(facultyId: string) {
    this.router.navigateByUrl(`${RouteEnum.virtualTour}/${facultyId}`, {state: {
      facultyCode: Object.entries(FacultyIdEnum).find(([key, value]) => value === facultyId)[0],
    }});
  }

  onChangeLight(hideSpotLight) {
    this.engineService.toggleSpotLight(hideSpotLight);
  }

  onTextureChange(textureUrl) {
    this.engineService.onTextureChange(this.textura)
  }

  culoareaManeruluiChange(event) {
    this.engineService.culoareaManeruluiChange(event.srcElement.value);
  }

  culoareaUsiiChange(event) {
    this.selectedTexture = null;
    this.cdr.detectChanges()
    this.engineService.culoareaFerestreiChange(event.srcElement.value);
  }
  
  culoareaRameiChange(event) {
    this.engineService.culoareaRameiChange(event.srcElement.value);
  }

  toggleDoorOpening() {
    this.engineService.toggleDoorOpening();
  }

  public closeFacultyCard(): void {
    this.facultyInfoService.activeFaculty.next(null);
  }

  public onSpecialtyClick(index: number): void {
    this.activeSpecialtyId = index === this.activeSpecialtyId ? null : index;
  }

  public switchView() {
    this.frontView = !this.frontView;

    this.engineService.switchView(this.frontView)
  }

  public onOpeningSideChange(event){
    this.engineService.onOpeningSideChange(event.value);
  }

  public onDoorWidthChange(event) {
    let width = event;

    if (event < this.doorWidthLimit.min) {
      this.doorWidth = width = this.doorWidthLimit.min;
    }

    if (event > this.doorWidthLimit.max) {
      this.doorWidth = width = this.doorWidthLimit.max;
    }
    
    this.engineService.onDoorWidthChange(width/10);
  }

  public onDoorHeightChange(event) {
    let height= event;

    if (event < this.doorHeightLimit.min) {
      this.doorHeight = height= this.doorHeightLimit.min;
    }

    if (event > this.doorHeightLimit.max) {
      this.doorHeight = height= this.doorHeightLimit.max;
    }

    this.engineService.onDoorHeightChange(event/10);
  }

  public onOpeningChange(event) {
    this.engineService.onOpeningChange(event.value);
  }

  public toggleFavorite(specialty): void {
    this.currentFavSpecialty = specialty.id;

    this.facultyApiService[specialty.isFavorite ? 'deleteFromFavorites' : 'addToFavorites'](specialty.id).subscribe({
      next: () => {
        this.currentFavSpecialty = null;
        specialty.isFavorite = !specialty.isFavorite;
      },
      error: () => {
        this.currentFavSpecialty = null;
      }
    })
  }
}
