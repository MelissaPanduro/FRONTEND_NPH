// Correcciones en modal-aplications.component.ts

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { VaccineApplications } from '../../../../../../model/VaccineAplications';
import { VaccineApplicationsService } from '../../../../../../service/vaccineAplications';
import { CicloVidaService } from '../../../../../../service/lifecycle.service';
import { ShedService } from '../../../../../../service/shed.service';
import { Shed } from '../../../../../../model/Shed';
import { CicloVida } from '../../../../../../model/Lifecycle';

@Component({
  selector: 'app-modal-applications',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './modal-aplications.component.html',
  styles: []
})
export class ModalAplicationsComponent implements OnInit, OnChanges {
  @Input() selectedApplication?: VaccineApplications;
  @Input() isModalOpen = false;
  @Input() isEditMode = false;
  
  @Output() applicationAdded = new EventEmitter<void>();
  @Output() applicationUpdated = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();
  
  sheds: Shed[] = [];
  cycleLifes: CicloVida[] = [];
  feedbackMessage: string = '';
  showFeedback: boolean = false;
  formSubmitted: boolean = false;
  applicationForm: VaccineApplications = {
    cycleLifeId: undefined,
    shedId: undefined,
    endDate: new Date().toISOString().split('T')[0],
    timesInWeeks: '',
    dateRegistration: new Date().toISOString().split('T')[0],
    costApplication: 0,
    amount: undefined,
    quantityBirds: 0,
    active: 'A',
    email: ''
  };

  constructor(
    private vaccineApplicationsService: VaccineApplicationsService,
    private shedService: ShedService,
    private cicloVidaService: CicloVidaService
  ) {}

  ngOnInit(): void {
    this.loadSheds();
    this.loadCycles();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando cambia el selectedApplication o el estado del modal
    if (changes['selectedApplication'] && changes['selectedApplication'].currentValue) {
      this.applicationForm = { ...changes['selectedApplication'].currentValue };
    }
    
    if (changes['isModalOpen'] && changes['isModalOpen'].currentValue === true) {
      this.formSubmitted = false;
    }
  }

  loadSheds(): void {
    this.shedService.getAll().subscribe(
      (data) => {
        this.sheds = data.filter(shed => shed.status === 'A');
      },
      (error) => console.error('Error al obtener galpones', error)
    );
  }

  loadCycles(): void {
    const typeIto = 'Vacunas';
    this.cicloVidaService.getCiclosByTypeIto(typeIto).subscribe(
      (cycles: CicloVida[]) => {
        console.log('Ciclos de vida obtenidos:', cycles);
        this.cycleLifes = cycles;
      },
      (error) => {
        console.error('Error al cargar los ciclos de vida:', error);
      }
    );
  }

  onCycleLifeChange(): void {
    const cycleLifeId = this.applicationForm.cycleLifeId;

    if (cycleLifeId == null || isNaN(+cycleLifeId)) {
      console.warn('⚠️ cycleLifeId inválido');
      return;
    }

    const selectedCycleLife = this.cycleLifes.find(c => c.id === +cycleLifeId);

    if (selectedCycleLife) {
      if (selectedCycleLife.timesInWeeks == null) {
        alert('El ciclo de vida seleccionado no tiene definido "timesInWeeks". Selecciona otro.');
        return;
      }

      this.applicationForm.endDate = selectedCycleLife.endDate
        ? (typeof selectedCycleLife.endDate === 'string'
            ? selectedCycleLife.endDate
            : selectedCycleLife.endDate.toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0];

      this.applicationForm.timesInWeeks = String(selectedCycleLife.timesInWeeks);
      this.applicationForm.nameIto = selectedCycleLife.nameIto || 'Desconocida';

      console.log('✔️ Ciclo de vida seleccionado:', selectedCycleLife);
    } else {
      alert('No se encontró información del ciclo de vida seleccionado.');
    }
  }

  closeModal(): void {
    this.modalClosed.emit();
  }

  addApplication(): void {
    this.formSubmitted = true;
    
    if (this.applicationForm?.cycleLifeId !== undefined && this.applicationForm?.shedId !== undefined) {
      if (!this.applicationForm.endDate) {
        alert('La fecha de aplicación no puede estar vacía.');
        return;
      }
  
      const endDate = new Date(this.applicationForm.endDate);
      const dateRegistration = new Date(); // fecha actual del sistema
  
      // Validación: Fecha de Registro debe ser ≥ Fecha de Aplicación + 1 día
      const minValidDate = new Date(endDate);
      minValidDate.setDate(minValidDate.getDate() + 1);
  
      if (dateRegistration < minValidDate) {
        alert('La Fecha de Registro debe ser al menos un día después de la Fecha de Aplicación.');
        return;
      }
  
      // Asignamos fecha del sistema al campo
      this.applicationForm.dateRegistration = formatDate(dateRegistration, 'yyyy-MM-dd', 'en-US');
      this.applicationForm.endDate = formatDate(endDate, 'yyyy-MM-dd', 'en-US');
  
      if (this.applicationForm.timesInWeeks == null || this.applicationForm.timesInWeeks === '') {
        this.applicationForm.timesInWeeks = '0';
      }
  
      console.log('Formulario que se enviará:', this.applicationForm);
  
      this.vaccineApplicationsService.createVaccineApplications(this.applicationForm).subscribe({
        next: () => {
          this.displayFeedback('Aplicación guardada correctamente');
          this.applicationAdded.emit();
          this.closeModal();
        },
        error: (err: any) => {
          console.error('Error al guardar la aplicación:', err);
          alert('Error al guardar la aplicación.');
        }
      });
    } else {
      alert('Por favor complete todos los campos requeridos.');
    }
  }
  
  updateApplication(): void {
    this.formSubmitted = true;
    
    if (!this.applicationForm.applicationId) return;
  
    if (!this.applicationForm.cycleLifeId) {
      console.error('El ID de la vacuna no puede ser nulo');
      return;
    }
  
    const endDate = new Date(this.applicationForm.endDate);
    const dateRegistration = new Date(this.applicationForm.dateRegistration);
  
    // Validación: Fecha de Registro debe ser ≥ Fecha de Aplicación + 1 día
    const minValidDate = new Date(endDate);
    minValidDate.setDate(minValidDate.getDate() + 1);
  
    if (dateRegistration < minValidDate) {
      console.error('La Fecha de Registro debe ser al menos un día después de la Fecha de Aplicación.');
      return;
    }
  
    this.applicationForm.endDate = formatDate(endDate, 'yyyy-MM-dd', 'en-US');
    this.applicationForm.dateRegistration = formatDate(dateRegistration, 'yyyy-MM-dd', 'en-US');
  
    this.vaccineApplicationsService.updateVaccineApplications(this.applicationForm.applicationId, this.applicationForm).subscribe({
      next: () => {
        this.displayFeedback('Aplicación actualizada correctamente');
        this.applicationUpdated.emit();
        this.closeModal();
      },
      error: (err: any) => {
        console.error('Error al actualizar la aplicación:', err);
        this.displayFeedback('Error al actualizar la aplicación');
      }
    });
  }

  displayFeedback(message: string) {
    this.feedbackMessage = message;
    this.showFeedback = true;
    // Cerrar automáticamente después de 3 segundos
    setTimeout(() => this.showFeedback = false, 3000);
  }

  calculateTotal(cost: number | undefined, quantity: number | undefined): number {
    if (cost && quantity && quantity > 0) {
      return cost * quantity;
    }
    return 0;
  }
}