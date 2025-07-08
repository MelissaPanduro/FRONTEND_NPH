import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vaccine} from '../../../../../model/Vaccine';
import { HttpClientModule } from '@angular/common/http';
import localeEs from '@angular/common/locales/es-PE';
import { Details } from '../../../../../model/VaccineDetail';
import { VaccineService } from '../../../../../service/vaccine.service';
import { VaccineDetailService } from '../../../../../service/vaccineDetail.service';

//Exportaciones:
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Import the UserOptions type for autoTable
import { UserOptions } from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


registerLocaleData(localeEs); // Registra el locale

@Component({
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './vaccine.component.html',
  styles: []
})
export class VaccineComponent implements OnInit {
  isModalOpen = false;
  vaccines: Vaccine[] = [];
  filteredVaccines: Vaccine[] = [];
  isLoading: boolean = true;
  isActive: boolean = true;
  isEditMode: boolean = false; 
  details: Details[] = []; 
  isDetailModalOpen: boolean = false; 
  selectedDetail: Details | null = null; 
  showFeedback: boolean = false; // Para controlar la visibilidad del feedback
  feedbackMessage: string = ''; // Mensaje de feedback

  paginatedVaccines: Vaccine[] = [];
  pageSize = 10;
  currentPage = 1;

  activeActive = true;
  activeFilter = 'A';
  Math = Math; // Esto expone Math al template


  // Filtros
  nameFilter: string = ''; 
  descriptionFilter: string = ''; 

  // Información del proveedor
  editVaccine: Vaccine | null = null;
  vaccineForm: Vaccine = { vaccine_id: 0, nameVaccine: '', typeVaccine: '', description: '', active: 'A' }; 
  detailForm: Details = { vaccineId: undefined, amountMl: undefined, doseAmount: undefined, manufacturingDate: '', expirationDate: '', price: '', stock: '' };

  constructor(private vaccineService: VaccineService, private vaccineDetailService: VaccineDetailService) {}

  ngOnInit(): void {
    this.getVaccines();
    this.loadDetails();
  }

  loadDetails(): void {
    this.vaccineDetailService.details$.subscribe({
        next: (data: Details[]) => {
            this.details = data; // Asegúrate de que data sea del tipo Details[]
        },
        error: (err: any) => {
            console.error('Error fetching details:', err);
        }
    });
  }

  // Método para cerrar el feedback
  closeFeedback() {
    this.showFeedback = false;
  }

  // Método para mostrar el feedback
  displayFeedback(message: string) {
    this.feedbackMessage = message;
    this.showFeedback = true;
  }

  getDetailForVaccine(vaccine: Vaccine): Details | null {
    return this.details.find(detail => detail.vaccineId === vaccine.vaccine_id) || null;
  }

  getPages(): number[] {
    const totalPages = Math.ceil(
      this.vaccines.filter((s) => s.active === this.activeFilter).length /
        this.pageSize
    );
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  viewDetail(detail: Details): void {
    this.selectedDetail = detail; 
    this.isDetailModalOpen = true; 
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedDetail = null; 
  }

  // Obtener todos los proveedores
  getVaccines(): void {
    this.vaccineService.vaccines$.subscribe({
      next: (data: Vaccine[]) => {
        this.vaccines = data;
        this.filterVaccines(); 
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching vaccines:', err);
        this.isLoading = false;
      }
    });
  }

  filterVaccines(): void {
    this.filteredVaccines = this.vaccines.filter(vaccine => {
      const matchesActive = vaccine.active === this.activeFilter;
      const matchesName = vaccine.nameVaccine.toLowerCase().includes(this.nameFilter.toLowerCase());
      const matchesDescription = vaccine.description.toLowerCase().includes(this.descriptionFilter.toLowerCase());
      return matchesActive && matchesName && matchesDescription;
    });
  }
  
  toggleActive(active: boolean): void {
    this.activeActive = active;
    this.activeFilter = active ? 'A' : 'I';
    this.filterVaccines();
  }
  
  cambiarPagina(pagina: number): void {
    this.currentPage = pagina;
    this.applyActiveFilter();
  }

  applyActiveFilter(): void {
    const filteredVaccines = this.vaccines.filter(
      (vaccine) => vaccine.active === this.activeFilter
    );
  
    this.paginatedVaccines = filteredVaccines.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }
  
  // Activar un proveedor
  activateVaccine(id: number | undefined): void {
    if (id !== undefined) {
      this.vaccineService.activateVaccine(id).subscribe({
        next: () => {
          this.getVaccines();
        },
        error: (err) => {
          console.error('Error activating vaccine:', err);
        }
      });
    } else {
      console.error('Invalid vaccine ID');
    }
  }

  // Inactivar un proveedor
  inactivateVaccine(vaccineId: number | undefined): void {
    if (vaccineId !== undefined) {
      this.vaccineService.inactivateVaccine(vaccineId).subscribe({
        next: () => {
          this.getVaccines();
        },
        error: (err) => {
          console.error('Error inactivating supplier:', err);
        }
      });
    } else {
      console.error('Invalid supplier ID');
    }
  }

  // Abrir el modal en modo agregar
  openModal(): void {
    this.isEditMode = false;
    this.vaccineForm = { vaccine_id: 0, nameVaccine: '', typeVaccine: '', description: '', active: 'A' };
    this.detailForm = { vaccineId: undefined, amountMl: undefined, doseAmount: undefined, manufacturingDate: '', expirationDate: '', price: '', stock: '' };
    this.isModalOpen = true;
  }

  // Abrir el modal en modo edición
  editVaccineDetails(vaccine: Vaccine): void {
    this.isEditMode = true;
    this.vaccineForm = { ...vaccine };
    const detail = this.getDetailForVaccine(vaccine);
    if (detail) {
      this.detailForm = { ...detail }; 
    }
    this.isModalOpen = true;
  }

  // Cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Agregar un nuevo proveedor
  addVaccine(): void {
    if (this.vaccineForm.vaccine_id === 0) {
      this.vaccineForm.vaccine_id = undefined; 
    }

    this.vaccineService.createVaccine(this.vaccineForm).subscribe({
      next: (newVaccine) => {
        this.detailForm.vaccineId = newVaccine.vaccine_id; 
        this.vaccineDetailService.createDetail(this.detailForm).subscribe(() => {
          this.getVaccines(); 
          this.closeModal(); 
        });
      },
      error: (err) => {
        console.error('Error adding supplier:', err);
      }
    });
  }

  updateVaccine(): void {
    if (this.vaccineForm.vaccine_id) {
        this.vaccineService.updateVaccine(this.vaccineForm.vaccine_id, this.vaccineForm).subscribe({
            next: () => {
                // Asegúrate de que estás usando el ID correcto para el detalle
                if (this.detailForm.vaccineDetailId !== undefined) {
                    this.vaccineDetailService.updateDetail(this.detailForm.vaccineDetailId, this.detailForm).subscribe({
                        next: () => {
                            this.getVaccines(); 
                            this.closeModal(); 
                        },
                        error: (err) => {
                            console.error('Error updating detail:', err);
                        }
                    });
                } else {
                    console.error('No se pudo encontrar el ID del detalle para actualizar.');
                }
            },
            error: (err) => {
                console.error('Error updating supplier:', err);
            }
        });
    } else {
        console.error('No se pudo encontrar el ID de la vacuna para actualizar.');
    }
  }

  getDaysUntilExpiration(expirationDate: string): number {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const timeDiff = expDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getExpirationStatusClass(expirationDate: string): string {
    const daysLeft = this.getDaysUntilExpiration(expirationDate);
    
    if (daysLeft < 0) {
      return 'text-red-600 font-bold';
    } else if (daysLeft < 30) {
      return 'text-amber-600 font-bold';
    } else {
      return 'text-green-600';
    }
  }
}
