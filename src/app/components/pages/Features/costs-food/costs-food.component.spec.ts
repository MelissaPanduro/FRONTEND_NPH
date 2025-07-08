import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostsFoodComponent } from './costs-food.component';

describe('CostsFoodComponent', () => {
  let component: CostsFoodComponent;
  let fixture: ComponentFixture<CostsFoodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostsFoodComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CostsFoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
