import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  url: string = 'http://localhost:5000/corveg/api/geology/lookup/ng-mat';
  constructor(private http: HttpClient) { }

  getGeologyLookUp():Observable<any> {
    return this.http.get<any>(this.url);
  }
}
