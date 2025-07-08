// additional-cost.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AdditionalCostService } from '../../../../../service/additional-cost.service';
import { AdditionalCost } from '../../../../../model/AdditionalCost';
import { AdditionalCostFormModalComponent } from './additional-cost-form-modal/additional-cost-form-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-additional-cost',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AdditionalCostFormModalComponent],
  templateUrl: './additional-cost.component.html',
  styleUrl: './additional-cost.component.css'
})
export class AdditionalCostComponent implements OnInit {
  costs: AdditionalCost[] = [];
  isModalOpen = false;
  selectedCost: AdditionalCost | null = null;

  constructor(private costService: AdditionalCostService) {}

  ngOnInit(): void {
    this.loadCosts();
  }

  loadCosts(): void {
    this.costService.getAll().subscribe({
      next: (data) => {
        this.costs = data;
      },
      error: (error) => {
        console.error('Error al cargar los costos:', error);
        this.showErrorAlert('Error al cargar los costos adicionales', 'Por favor, intenta nuevamente más tarde.');
      }
    });
  }

  openModal(cost?: AdditionalCost): void {
    this.selectedCost = cost || null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCost = null;
  }

  handleSave(cost: AdditionalCost): void {
    this.loadCosts();
    this.closeModal();
    
    Swal.fire({
      icon: 'success',
      title: 'Guardado con éxito',
      text: 'El costo adicional ha sido guardado correctamente.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  }

  deleteCost(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.costService.delete(id).subscribe({
          next: () => {
            this.loadCosts();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El costo adicional ha sido eliminado correctamente.',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error al eliminar el costo:', error);
            this.showErrorAlert('Error al eliminar', 'No se pudo eliminar el costo adicional.');
          }
        });
      }
    });
  }

  showErrorAlert(title: string, text: string): void {
    Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: '#3085d6'
    });
  }
}