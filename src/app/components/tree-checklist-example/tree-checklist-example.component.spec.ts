import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeChecklistExampleComponent } from './tree-checklist-example.component';

describe('TreeChecklistExampleComponent', () => {
  let component: TreeChecklistExampleComponent;
  let fixture: ComponentFixture<TreeChecklistExampleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeChecklistExampleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeChecklistExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
