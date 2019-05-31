import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  url: string = 'http://localhost:5000/corveg/api/geology/lookup/ng-mat';
  constructor(private http: HttpClient) { }

  getGeologyLookUp():Observable<any> {
    let response1 = this.http.get<any>(this.url);
    let response2 = of({'Rainforest Structure': null});
    let response3 = of({'Site Description': null});
    let response4 = of({Strata: ['Emergent Layer','Upper Tree Layer','Secondry Tree Layer', 'Tertiary Tree Layer', 'Upper Shrub Layer', 'Secondary Shrub Layer', 'Ground Layer']});
    let response5 = of({'Situation': null});
    let response6 = of({'Soil': null});
    let response7 = of({'Structure': null});
    let response8 = of({'Vegetaion Community': null});
    let response9 = of({'Disturbance': ['Fire', 'Storm', 'Road Works', 'Salinity', 'Grazing', 'Erosion', 'Logging']});
  
    return forkJoin(response1, response2, response3, response4, response5, response6, response7, response8, response9);
  }
}
