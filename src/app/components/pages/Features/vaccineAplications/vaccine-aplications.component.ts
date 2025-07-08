// Correcciones en vaccine-aplications.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Shed } from '../../../../../model/Shed';
import { ShedService } from '../../../../../service/shed.service';
import { VaccineApplicationsService } from '../../../../../service/vaccineAplications';
import { formatDate } from '@angular/common';
import { VaccineApplications } from '../../../../../model/VaccineAplications';
import { CicloVida } from '../../../../../model/Lifecycle';
import { CicloVidaService } from '../../../../../service/lifecycle.service';
import { ModalAplicationsComponent } from "./modal-aplications/modal-aplications.component";

@Component({
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ModalAplicationsComponent],
  templateUrl: './vaccine-aplications.component.html',
  styles: []
})
export class VaccineApplicationsComponent implements OnInit {
  
  isModalOpen = false;
  applications: VaccineApplications[] = [];
  filteredApplications: VaccineApplications[] = [];
  sheds: Shed[] = [];
  cycleLifes: CicloVida[] = [];
  isLoading: boolean = true;
  isEditMode: boolean = false;
  formSubmitted: boolean = false;
  applicationForm: VaccineApplications = {} as VaccineApplications;

  activeActive = true;
  activeFilter = 'A';
  paginatedVaccineApplications: VaccineApplications[] = [];
  pageSize = 10;
  currentPage = 1;

  totalPages: number = 0;

  applicationIdFilter: string = '';
  amountFilter: string = '';
  feedbackMessage: string = '';
  showFeedback: boolean = false;
  

  constructor(
    private vaccineApplicationsService: VaccineApplicationsService,
    private shedService: ShedService,
    private cicloVidaService: CicloVidaService
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.loadSheds();
    this.loadCycles();
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
        this.cycleLifes = cycles;
      },
      (error) => {
        console.error('Error al cargar los ciclos de vida:', error);
      }
    );
  }

  closeFeedback() {
    this.showFeedback = false;
  }

  displayFeedback(message: string) {
    this.feedbackMessage = message;
    this.showFeedback = true;
    // Cerrar automáticamente después de 3 segundos
    setTimeout(() => this.showFeedback = false, 3000);
  }

  getApplications(): void {
    this.isLoading = true;

    this.vaccineApplicationsService.vaccineApplications$.subscribe({
      next: (data: VaccineApplications[]) => {
        if (!data || data.length === 0) {
          console.warn('No se encontraron aplicaciones de vacuna.');
          this.applications = [];
          this.filteredApplications = [];
          this.isLoading = false;
          return;
        }

        this.applications = data;
        this.filterApplications();
        this.totalPages = this.getPages().length;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
        this.isLoading = false;
      }
    });
  }

  getPages(): number[] {
    const totalPages = Math.ceil(
      this.applications.filter((s) => s.active === this.activeFilter).length /
      this.pageSize
    );
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  toggleActive(active: boolean): void {
    this.activeActive = active;
    this.activeFilter = active ? 'A' : 'I';
    this.filterApplications();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.getPages().length) return;
    this.currentPage = pagina;
    this.applyActiveFilter();
  }

  applyActiveFilter(): void {
    const filteredApplications = this.filteredApplications.filter(
      (app) => app.active === this.activeFilter
    );

    this.paginatedVaccineApplications = filteredApplications.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  filterApplications(): void {
    this.filteredApplications = this.applications.filter(application => {
      // Filtrar por ID si hay un filtro
      if (this.applicationIdFilter && application.applicationId) {
        if (!application.applicationId.toString().includes(this.applicationIdFilter)) {
          return false;
        }
      }
      
      // Filtrar por cantidad si hay un filtro
      if (this.amountFilter && application.amount) {
        if (!application.amount.toString().includes(this.amountFilter)) {
          return false;
        }
      }
      
      // Siempre filtrar por estado activo/inactivo
      return application.active === this.activeFilter;
    });
    
    this.applyActiveFilter();
  }

  activateApplication(applicationId: number | undefined): void {
    if (applicationId !== undefined) {
      this.vaccineApplicationsService.activateVaccineApplications(applicationId).subscribe({
        next: () => {
          this.getApplications();
          this.displayFeedback('Aplicación activada correctamente');
        },
        error: (err: any) => {
          console.error('Error activating application:', err);
          this.displayFeedback('Error al activar la aplicación');
        }
      });
    } else {
      console.error('Invalid application ID');
    }
  }

  inactivateApplication(applicationId: number | undefined): void {
    if (applicationId !== undefined) {
      this.vaccineApplicationsService.inactivateVaccineApplications(applicationId).subscribe({
        next: () => {
          this.getApplications();
          this.displayFeedback('Aplicación inactivada correctamente');
        },
        error: (err: any) => {
          console.error('Error inactivating application:', err);
          this.displayFeedback('Error al inactivar la aplicación');
        }
      });
    } else {
      console.error('Invalid application ID');
    }
  }

  formatDate(date: string | Date | null): string {
    if (date === null) {
      return '';
    }

    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    const day = parsedDate.getDate();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();

    return `${day}-${month}-${year}`;
  }

  getNameIto(cycleLifeId: number | undefined, application: VaccineApplications): string {
    if (!application) return 'Desconocida';

    if (cycleLifeId == null) return 'Desconocida';

    const cicloVida = this.cycleLifes?.find(c => c.id === cycleLifeId && c.typeIto === 'Vacunas');

    return cicloVida?.nameIto ?? application.nameIto ?? 'Desconocida';
  }

  getShedName(shedId: number | undefined): string {
    const shed = this.sheds.find(v => v.id === shedId);
    return shed ? shed.name : 'Desconocida';
  }

  calculateTotal(cost: number | undefined, quantity: number | undefined): number {
    if (cost && quantity && quantity > 0) {
      return cost * quantity;
    }
    return 0;
  }

  resetFilters() {
    this.applicationIdFilter = '';
    this.amountFilter = '';
    this.filterApplications();
  }

  // Método para abrir el modal para una nueva aplicación
  openModal(): void {
    this.isEditMode = false;
    this.applicationForm = {
      cycleLifeId: undefined,
      shedId: undefined,
      endDate: new Date().toISOString().split('T')[0],  // Fecha actual como valor predeterminado
      timesInWeeks: '',
      dateRegistration: new Date().toISOString().split('T')[0],  // Fecha actual como valor predeterminado
      costApplication: 0,
      amount: undefined,
      quantityBirds: 0,
      active: 'A',
      email: ''
    };
    this.isModalOpen = true;
  }

  // Método para abrir el modal para editar una aplicación existente
  editApplicationDetails(application: VaccineApplications): void {
    this.isEditMode = true;
    // Crear una copia profunda para evitar modificar directamente el objeto original
    this.applicationForm = JSON.parse(JSON.stringify(application));
    this.isModalOpen = true;
  }

  // Método para cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  cargarMas() {
    if (this.currentPage < this.getPages().length) {
      const nextPage = this.currentPage + 1;
      this.cambiarPagina(nextPage);
      
      this.feedbackMessage = "Más registros cargados correctamente";
      this.showFeedback = true;
      setTimeout(() => this.showFeedback = false, 3000);
    }
  }
}