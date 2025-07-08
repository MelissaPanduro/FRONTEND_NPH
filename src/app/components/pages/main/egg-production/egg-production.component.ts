import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { EggProductionService } from '../../../../../service/egg-production.service';
import { EggProduction } from '../../../../../model/EggProduction';
import { EggProductionFormComponent } from './egg-production-form/egg-production-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-egg-production',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    RouterModule,
    EggProductionFormComponent
  ],
  templateUrl: './egg-production.component.html',
  styleUrl: './egg-production.component.css'
})
export class EggProductionComponent implements OnInit {
  eggProductions: EggProduction[] = [];
  loading: boolean = false;
  showModal = false;
  selectedProduction: EggProduction | null = null;
  
  constructor(private eggProductionService: EggProductionService) {}
  
  ngOnInit(): void {
    this.loadEggProductions();
  }
  
  loadEggProductions(): void {
    this.loading = true;
    this.eggProductionService.getAll().subscribe({
      next: (data) => {
        this.eggProductions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading egg productions:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error!',
          text: 'No se pudieron cargar los datos de producción de huevos',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }
  
  openModal(production?: EggProduction): void {
    this.selectedProduction = production || null;
    this.showModal = true;
  }
  
  closeModal(): void {
    this.showModal = false;
    this.selectedProduction = null;
  }
  
  onFormSubmitSuccess(): void {
    this.closeModal();
    this.loadEggProductions();
  }
  
  deleteEggProduction(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eggProductionService.delete(id).subscribe({
          next: () => {
            this.eggProductions = this.eggProductions.filter(item => item.id !== id);
            Swal.fire(
              '¡Eliminado!',
              'El registro ha sido eliminado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error deleting egg production:', error);
            Swal.fire({
              title: 'Error!',
              text: 'No se pudo eliminar el registro',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}