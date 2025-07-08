import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EggProductionService } from '../../../../../../service/egg-production.service';
import { EggProduction } from '../../../../../../model/EggProduction';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-egg-production-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './egg-production-form.component.html'
})
export class EggProductionFormComponent implements OnInit {
  @Input() production: EggProduction | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  
  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private eggProductionService: EggProductionService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    if (this.production) {
      // Format the date to YYYY-MM-DD for the date input
      const formattedDate = this.production.registrationDate.split('T')[0];
      
      this.form.patchValue({
        ...this.production,
        registrationDate: formattedDate
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      quantityEggs: [0, [Validators.required, Validators.min(1)]],
      eggsKilo: [0, [Validators.required, Validators.min(0.1)]],
      priceKilo: [0, [Validators.required, Validators.min(0.1)]],
      registrationDate: [new Date().toISOString().split('T')[0], Validators.required],
      hensId: [null, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.form.value;
    
    if (this.production) {
      // Update existing record
      const updatedData: EggProduction = {
        id: this.production.id,
        ...formData
      };
      
      this.eggProductionService.update(this.production.id, updatedData).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            title: '¡Éxito!',
            text: 'Registro actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          });
          this.formSubmitted.emit();
        },
        error: (error) => {
          console.error('Error updating egg production:', error);
          this.loading = false;
          Swal.fire({
            title: 'Error!',
            text: 'No se pudo actualizar el registro',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
    } else {
      // Create new record
      this.eggProductionService.create(formData).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            title: '¡Éxito!',
            text: 'Nuevo registro creado correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          });
          this.formSubmitted.emit();
        },
        error: (error) => {
          console.error('Error creating egg production:', error);
          this.loading = false;
          Swal.fire({
            title: 'Error!',
            text: 'No se pudo crear el registro',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}