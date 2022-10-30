import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { panoramas } from 'src/app/core/constants/faculties-geo-location.constant';
import { EngineService } from 'src/app/core/services/3d-map/engine.service';
import { Faculty } from 'src/app/shared/models/faculty.model';

declare var google: any;

declare global {
  interface Window {
    initMap: () => void;
    google: typeof google;
  }
}

@Component({
  selector: 'app-virtual-tour',
  templateUrl: './virtual-tour.component.html',
  styleUrls: ['./virtual-tour.component.scss'],
  providers: [EngineService],
})
export class VirtualTourComponent implements OnInit {
  @ViewChild('rendererCanvas', {static: true})
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  public activeFaculty: Faculty;
  
  public panorama: google.maps.StreetViewPanorama;

  public selectedFaculty = 'fcim';

  public availableFaculties = Object.keys(panoramas);
  featureLayer;

  infowindow;
  map;
  service;
  
  @ViewChild('test')
  public input;

  constructor(
    private router: Router,
  ) { 
    const facultyCode = this.router?.getCurrentNavigation()?.extras?.state?.facultyCode;

    if (facultyCode && this.availableFaculties.includes(facultyCode)) {
      this.selectedFaculty = facultyCode;
    }

    // var service = new google.maps.places.PlacesService(map);

    // service = new google.maps.places.PlacesService(map);
    // service.textSearch(request, callback);


    // new google.maps.StreetViewService()
    // .getPanorama({ location: { lat: 47.061621, lng: 28.867827 }}, (data) => {
    //   this.initPanorama(this.selectedFaculty);
    // });
  }

  ngOnInit(): void {
    this.initMap();
      
  }
  
  search() {
    const request = {
      query: this.input.nativeElement.value,
      fields: ["name", "place_id","geometry"],
    };
  
    this.service = new google.maps.places.PlacesService(this.map);
    this.featureLayer = this.map.getFeatureLayer("POSTAL_CODE");
  
    this.service.findPlaceFromQuery(
      request,
      (
        results: google.maps.places.PlaceResult[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          for (let i = 0; i < results.length; i++) {
            this.createMarker(results[i]);
          }
          this.map.setCenter(results[0].geometry!.location!);
        }

        const featureStyleOptions = {
          strokeColor: '#810FCB',
          strokeOpacity: 1.0,
          strokeWeight: 3.0,
          fillColor: '#810FCB',
          fillOpacity: 0.5
        };

        // Apply the style to a single boundary.
        this.featureLayer.style = (options: { feature: { placeId: string; }; }) => {
          if (options.feature.placeId == results[0].place_id) { // Hana, HI
            return featureStyleOptions;
          }
          return null
        };
      }
    );
  }
  
  public  initMap(): void {
    const sydney = new google.maps.LatLng(-33.867, 151.195);
  
    this.infowindow = new google.maps.InfoWindow();
    
    this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
      center: sydney,
      zoom: 15,
      mapId: '35e8e04b2cef3841'
    });
  }
  
  
  public  createMarker(place: google.maps.places.PlaceResult) {
    if (!place.geometry || !place.geometry.location) return;
  
    const marker = new google.maps.Marker({
      map: this.map,
      position: place.geometry.location,
    });
  
    google.maps.event.addListener(marker, "click", () => {
      this.infowindow.setContent(place.name || "");
      this.infowindow.open(this.map);
    });
  }

  public getAdditionalPanorama(panorama): google.maps.StreetViewPanoramaData {
    return {
      location: {
        pano: panorama.pano,
        description: panorama.description,
        latLng: new google.maps.LatLng(panorama.position.lat, panorama.position.long),
      },
      links: panorama.links,
      copyright: 'Unipply (c)',
      tiles: {
        tileSize: new google.maps.Size(5120, 2560),
        worldSize: new google.maps.Size(5120, 2560),
        centerHeading: panorama.centerHeading || 0,
        getTileUrl: () => panorama.imagePath,
      },
    };
  }
  
  public initPanorama(facultyCode: string): void {
    this.panorama = new google.maps.StreetViewPanorama(
      document.getElementById('street-view') as HTMLElement,
      { pano: `${facultyCode}_first`, visible: true }
    );

    this.panorama.registerPanoProvider(() => {
      return this.getAdditionalPanorama(panoramas[facultyCode][0]);
    });
  
    this.panorama.addListener('pano_changed', () => {
      const newPano = panoramas[facultyCode].find((p) => p.pano === this.panorama.getPano())
      
      if (newPano) {
        this.panorama.registerPanoProvider(() => {
          return this.getAdditionalPanorama(newPano);
        });
      }
    })

    this.panorama.addListener('links_changed', () => {
      const currentPano = panoramas[facultyCode].find((p) => p.pano === this.panorama.getPano())

      if (!!currentPano) {
        this.panorama.getLinks().push(...currentPano.links);
      }
    });
  }

  public navigateBack() {
    this.router.navigateByUrl('/');
  }

  public onFacultyChange(event) {
    this.selectedFaculty = event.value;

    this.initPanorama(this.selectedFaculty);
  }
}
