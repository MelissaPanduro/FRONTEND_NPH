import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdditionalCost } from '../../../../../../model/AdditionalCost';
import { AdditionalCostService } from '../../../../../../service/additional-cost.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-additional-cost-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './additional-cost-form-modal.component.html',
  styleUrl: './additional-cost-form-modal.component.css'
})
export class AdditionalCostFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() cost: AdditionalCost | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<AdditionalCost>();

  costForm: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private costService: AdditionalCostService
  ) {
    this.costForm = this.createForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cost'] && this.cost) {
      this.costForm.patchValue({
        costType: this.cost.costType,
        amount: this.cost.amount,
        registrationDate: this.formatDateForInput(this.cost.registrationDate),
        description: this.cost.description
      });
    } else if (changes['isOpen'] && this.isOpen && !this.cost) {
      this.costForm.reset({
        costType: '',
        amount: 0,
        registrationDate: this.formatDateForInput(new Date().toISOString()),
        description: ''
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      costType: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      registrationDate: [this.formatDateForInput(new Date().toISOString()), [Validators.required]],
      description: ['']
    });
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.costForm.invalid) {
      this.costForm.markAllAsTouched();
      
      // Mostrar alerta de validación
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Por favor, completa todos los campos requeridos.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.submitting = true;
    const formData = this.costForm.value;
    const costData: AdditionalCost = {
      id: this.cost?.id || 0,
      costType: formData.costType,
      amount: formData.amount,
      registrationDate: new Date(formData.registrationDate).toISOString(),
      description: formData.description
    };

    // Mostrar cargando
    const loadingSwal = Swal.mixin({
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    loadingSwal.fire({
      title: 'Guardando...',
      html: 'Por favor espere'
    });

    if (this.cost?.id) {
      // Actualizar
      this.costService.update(this.cost.id, costData).subscribe({
        next: (result) => {
          Swal.close(); // Cerrar el loading
          this.handleSuccess(result);
        },
        error: (error) => {
          Swal.close(); // Cerrar el loading
          this.handleError(error);
        }
      });
    } else {
      // Crear nuevo
      this.costService.create(costData).subscribe({
        next: (result) => {
          Swal.close(); // Cerrar el loading
          this.handleSuccess(result);
        },
        error: (error) => {
          Swal.close(); // Cerrar el loading
          this.handleError(error);
        }
      });
    }
  }

  handleSuccess(result: AdditionalCost): void {
    this.submitting = false;
    this.save.emit(result);
  }

  handleError(error: any): void {
    console.error('Error al guardar el costo:', error);
    this.submitting = false;
    
    Swal.fire({
      icon: 'error',
      title: 'Error al guardar',
      text: 'No se pudo guardar el costo adicional. Por favor, intenta nuevamente.',
      confirmButtonColor: '#3085d6'
    });
  }

  onClose(): void {
    if (this.costForm.dirty) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar. ¿Deseas cerrar el formulario?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.close.emit();
        }
      });
    } else {
      this.close.emit();
    }
  }
}
