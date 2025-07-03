import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { VaccineApplications } from '../../../../../../interfaces/VaccineAplications';
import { VaccineApplicationsService } from '../../../../../../service/vaccineAplications';
import { CicloVidaService } from '../../../../../../service/lifecycle.service';
import { ShedService } from '../../../../../../service/shed.service';
import { Shed } from '../../../../../../interfaces/Shed';
import { CicloVida } from '../../../../../../interfaces/Lifecycle';
import { retry, catchError, timeout } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

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

  cycleLifes: CicloVida[] = [];
  feedbackMessage: string = '';
  showFeedback: boolean = false;
  formSubmitted: boolean = false;
  showCustomInput: boolean = false;
  isLoading: boolean = false; // Loading state
  retryCount: number = 0;
  maxRetries: number = 3;

  applicationForm: VaccineApplications = {
    cycleLifeId: undefined,
    henId: undefined,
    endDate: '',
    timesInWeeks: '',
    dateRegistration: '',
    costApplication: 0,
    amount: undefined,
    quantityBirds: 0,
    active: 'A',
    email: '',
    viaApplication: ''
  };

  constructor(
    private vaccineApplicationsService: VaccineApplicationsService,
    private shedService: ShedService,
    private cicloVidaService: CicloVidaService
  ) {}

  ngOnInit(): void {
    this.loadCycles();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedApplication'] && changes['selectedApplication'].currentValue) {
      this.applicationForm = { ...changes['selectedApplication'].currentValue };
    }
    
    if (changes['isModalOpen'] && changes['isModalOpen'].currentValue === true) {
      this.formSubmitted = false;
      this.retryCount = 0; // Reset retry count when modal opens
      if (!this.isEditMode) {
        this.resetForm();
      }
    }
  }

  onViaApplicationChange(event: any): void {
    const selectedValue = event.target.value;
    if (selectedValue === 'Otra') {
      this.showCustomInput = true;
      this.applicationForm.viaApplication = '';
    } else {
      this.showCustomInput = false;
      this.applicationForm.viaApplication = selectedValue;
    }
  }

  onCustomViaInputChange(event: any): void {
    this.applicationForm.viaApplication = event.target.value;
  }

  isViaApplicationValid(): boolean {
    return !!(this.applicationForm.viaApplication && this.applicationForm.viaApplication.trim());
  }

  formatGalponDisplay(henId: number | string | null | undefined): string {
    if (henId === null || henId === undefined || henId === '' || henId === 0) {
      return 'Sin galpón asignado';
    }
    return `Galpón ${henId}`;
  }

  getGalponDisplayText(application: VaccineApplications): string {
    return this.formatGalponDisplay(application.henId);
  }

  getFormattedGalponForDisplay(): string {
    return this.formatGalponDisplay(this.applicationForm.henId);
  }

  hasGalponAssigned(): boolean {
    return this.applicationForm.henId !== null && 
           this.applicationForm.henId !== undefined && 
           this.applicationForm.henId !== 0;
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
        this.handleError(error, 'Error al cargar los ciclos de vida');
      }
    );
  }

  onCycleLifeChange(): void {
    const cycleLifeId = this.applicationForm.cycleLifeId;
    this.clearDependentFields();

    if (!cycleLifeId || cycleLifeId <= 0 || isNaN(+cycleLifeId)) {
      console.warn('⚠️ cycleLifeId inválido o vacío');
      return;
    }

    const selectedCycleLife = this.cycleLifes.find(c => c.id === +cycleLifeId);

    if (!selectedCycleLife) {
      console.error('❌ No se encontró el ciclo de vida con ID:', cycleLifeId);
      this.showErrorMessage('No se encontró información del ciclo de vida seleccionado.');
      return;
    }

    if (selectedCycleLife.timesInWeeks == null) {
      this.showErrorMessage('El ciclo de vida seleccionado no tiene definido "timesInWeeks". Selecciona otro.');
      this.applicationForm.cycleLifeId = undefined;
      return;
    }

    try {
      this.applicationForm.endDate = this.formatDateForInput(selectedCycleLife.endDate);
      this.applicationForm.timesInWeeks = String(selectedCycleLife.timesInWeeks);
      this.applicationForm.henId = selectedCycleLife.henId ?? null;
      
      if ('nameIto' in this.applicationForm) {
        (this.applicationForm as any).nameIto = selectedCycleLife.nameIto || 'Desconocida';
      }

      console.log('✅ Información del ciclo aplicada:', {
        cycleLifeId: selectedCycleLife.id,
        endDate: this.applicationForm.endDate,
        timesInWeeks: this.applicationForm.timesInWeeks,
        henId: this.applicationForm.henId,
        henIdDisplay: this.formatGalponDisplay(this.applicationForm.henId),
        nameIto: selectedCycleLife.nameIto
      });

      this.displayFeedback('Información de la vacuna cargada correctamente');

    } catch (error) {
      console.error('❌ Error al asignar información del ciclo:', error);
      this.showErrorMessage('Error al cargar la información de la vacuna.');
    }
  }

  private clearDependentFields(): void {
    this.applicationForm.endDate = '';
    this.applicationForm.timesInWeeks = '';
    this.applicationForm.henId = undefined;
    if ('nameIto' in this.applicationForm) {
      (this.applicationForm as any).nameIto = '';
    }
  }

  private formatDateForInput(date: any): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }

    if (typeof date === 'string') {
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  }

  private showErrorMessage(message: string): void {
    this.displayFeedback(message);
  }

  private resetForm(): void {
    this.applicationForm = {
      cycleLifeId: undefined,
      henId: undefined,
      endDate: '',
      timesInWeeks: '',
      dateRegistration: '',
      costApplication: 0,
      amount: undefined,
      quantityBirds: 0,
      active: 'A',
      email: '',
      viaApplication: ''
    };
  }

  closeModal(): void {
    this.modalClosed.emit();
  }

  // Improved error handling method
  private handleError(error: HttpErrorResponse, customMessage: string = 'Error en la operación'): void {
    let errorMessage = customMessage;
    
    if (error.status === 503) {
      errorMessage = 'El servicio no está disponible temporalmente. Por favor, inténtelo de nuevo en unos momentos.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor. Por favor, contacte al administrador.';
    } else if (error.status === 404) {
      errorMessage = 'El servicio solicitado no fue encontrado.';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = 'Error en la solicitud. Verifique los datos ingresados.';
    }

    console.error('Detalles del error:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url
    });

    this.displayFeedback(errorMessage);
  }

  // Enhanced addApplication with retry mechanism
  addApplication(): void {
    this.formSubmitted = true;
    const datos = this.applicationForm;

    // Validation logic remains the same
    if (
      datos.cycleLifeId === undefined || 
      datos.henId === null || datos.henId === undefined ||
      datos.amount === undefined || 
      datos.costApplication === undefined ||
      datos.viaApplication === undefined || 
      datos.email === undefined ||
      datos.quantityBirds === undefined
    ) {
      this.displayFeedback('Por favor complete todos los campos requeridos, incluyendo la selección de vacuna que asignará el galpón.');
      return;
    }

    if (datos.amount <= 0) {
      this.displayFeedback('El campo "Cantidad de dosis aplicadas" debe ser mayor a cero.');
      return;
    }

    if (datos.costApplication <= 0) {
      this.displayFeedback('El campo "Costo de aplicación" debe ser mayor a cero.');
      return;
    }

    if (!/^[^@]+@[^@]+\.[^@]+$/.test(datos.email)) {
      this.displayFeedback('El correo electrónico no tiene un formato válido.');
      return;
    }

    // Default values
    if (!datos.timesInWeeks) {
      datos.timesInWeeks = '0';
    }

    if (!datos.active) {
      datos.active = 'A';
    }

    // Format dates
    const dateRegistration = new Date();
    datos.dateRegistration = formatDate(dateRegistration, 'yyyy-MM-dd', 'en-US');

    if (datos.endDate) {
      const endDate = new Date(datos.endDate);
      datos.endDate = formatDate(endDate, 'yyyy-MM-dd', 'en-US');
    }

    console.log('Formulario que se enviará:', datos);
    console.log('henId que se guardará en BD:', datos.henId);

    this.isLoading = true;
    this.displayFeedback('Guardando aplicación...');

    this.vaccineApplicationsService.createVaccineApplications(datos)
      .pipe(
        timeout(30000), // 30 second timeout
        retry(this.maxRetries),
        catchError((error: HttpErrorResponse) => {
          console.error('Error after retries:', error);
          return throwError(error);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.retryCount = 0;
          this.displayFeedback('Aplicación guardada correctamente');
          this.applicationAdded.emit();
          this.closeModal();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.handleError(error, 'Error al guardar la aplicación');
          
          // Offer retry option for 503 errors
          if (error.status === 503 && this.retryCount < this.maxRetries) {
            setTimeout(() => {
              this.retryCount++;
              this.displayFeedback(`Reintentando... (${this.retryCount}/${this.maxRetries})`);
              this.addApplication();
            }, 2000 * this.retryCount); // Exponential backoff
          }
        }
      });
  }

  // Enhanced updateApplication with retry mechanism
  updateApplication(): void {
    this.formSubmitted = true;
  
    if (!this.applicationForm.applicationId) return;
  
    if (!this.applicationForm.cycleLifeId) {
      console.error('El ID de la vacuna no puede ser nulo');
      return;
    }

    if (this.applicationForm.henId === null || this.applicationForm.henId === undefined) {
      this.showErrorMessage('Debe seleccionar una vacuna que tenga un galpón asignado.');
      return;
    }
  
    if (this.applicationForm.endDate) {
      const endDate = new Date(this.applicationForm.endDate);
      this.applicationForm.endDate = formatDate(endDate, 'yyyy-MM-dd', 'en-US');
    }
  
    if (this.applicationForm.dateRegistration) {
      const dateRegistration = new Date(this.applicationForm.dateRegistration);
      this.applicationForm.dateRegistration = formatDate(dateRegistration, 'yyyy-MM-dd', 'en-US');
    }

    console.log('Datos de actualización:', this.applicationForm);
    console.log('henId que se actualizará en BD:', this.applicationForm.henId);

    this.isLoading = true;
    this.displayFeedback('Actualizando aplicación...');
  
    this.vaccineApplicationsService.updateVaccineApplications(this.applicationForm.applicationId, this.applicationForm)
      .pipe(
        timeout(30000),
        retry(this.maxRetries),
        catchError((error: HttpErrorResponse) => {
          console.error('Error after retries:', error);
          return throwError(error);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.retryCount = 0;
          this.displayFeedback('Aplicación actualizada correctamente');
          this.applicationUpdated.emit();
          this.closeModal();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.handleError(error, 'Error al actualizar la aplicación');
        }
      });
  }

  displayFeedback(message: string) {
    this.feedbackMessage = message;
    this.showFeedback = true;
    // Close automatically after 5 seconds (increased from 3)
    setTimeout(() => this.showFeedback = false, 5000);
  }

  calculateTotal(cost: number | undefined, quantity: number | undefined): number {
    if (cost && quantity && quantity > 0) {
      return cost * quantity;
    }
    return 0;
  }

  // Manual retry method for user-triggered retries
  retryLastOperation(): void {
    if (this.isEditMode) {
      this.updateApplication();
    } else {
      this.addApplication();
    }
  }

  // Check if retry is available
  canRetry(): boolean {
    return this.retryCount < this.maxRetries && !this.isLoading;
  }
}