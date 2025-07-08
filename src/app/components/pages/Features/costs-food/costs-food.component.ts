import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Food } from '../../../../../model/food';
import { FoodService } from '../../../../../service/food.service';
import { FoodCost, InsertCost, UpdateCost } from '../../../../../model/cost';
import { CostFoodService } from '../../../../../service/cost-food.service';
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-costs-food',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './costs-food.component.html',
})
export class CostsFoodComponent implements OnInit {
  isModalOpen = false;
  isModalEdit = false;
  isModalDelete = false;
  isModalRestore = false;
  descargaOpen: boolean = false;
  showInactive: boolean = false;
  activeFoods: Food[] = [];
  costActive: FoodCost[] = [];
  costInactive: FoodCost[] = [];
  newCostFood: InsertCost = {} as InsertCost;
  costToEdit: UpdateCost = {} as UpdateCost;
  costIdToDelete: number | null = null;
  costIdToRestore: number | null = null;
  costWeekNumberFilter: string = '';
  filteredCostFoods: FoodCost[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  filteredWeeks: string[] = [];
  selectedFeedType: string = '';

  constructor(
    private costService: CostFoodService,
    private foodService: FoodService
  ) { }

  ngOnInit(): void {
    this.getCostFoods();
    this.getActiveFoods();
  }

  getTableData(): FoodCost[] {
    let baseList = this.filteredCostFoods.length > 0
      ? this.filteredCostFoods
      : (this.showInactive ? this.costInactive : this.costActive);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return baseList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPages(): number[] {
    const filteredCount = this.filteredCostFoods.length > 0
      ? this.filteredCostFoods.length
      : (this.showInactive ? this.costInactive : this.costActive).length;

    const totalPages = Math.ceil(filteredCount / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  cambiarPagina(page: number): void {
    this.currentPage = page;
  }

  getActiveFoods(): void {
    this.foodService.getActiveFoods().subscribe({
      next: (data: Food[]) => {
        this.activeFoods = data; // Asignar lista de alimentos activos
      },
      error: (err) => {
        console.error('Error al obtener alimentos activos:', err);
      }
    });
  }

  getCostFoods(): void {
    const serviceMethod = this.showInactive ? this.costService.getICost() : this.costService.getACost();

    serviceMethod.subscribe({
      next: (data: FoodCost[]) => {
        if (this.showInactive) {
          this.costInactive = data;
        } else {
          this.costActive = data;
        }
      },
      error: (err) => {
        console.error('Error al obtener el costo de alimentos:', err);
      }
    });
  }

  toggleCostList(): void {
    this.showInactive = !this.showInactive;
    this.getCostFoods();
  }

  toggleDescarga(): void {
    this.descargaOpen = !this.descargaOpen;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  openModalDelete(idFoodCosts: number): void {
    this.costIdToDelete = idFoodCosts;
    this.isModalDelete = true;
  }

  openModalRestore(idFoodCosts: number): void {
    this.costIdToRestore = idFoodCosts;
    this.isModalRestore = true;
  }

  addCost(): void {
    this.costService.addNewCost(this.newCostFood).subscribe({
      next: (data) => {
        console.log('Costo de Alimento agregado:', data);
        this.showInactive = false;
        this.closeModal();
        this.getCostFoods();
        this.resetForm();
        Swal.fire({
          icon: 'success',
          title: 'Costo de Alimento agregado',
          text: `El costo de alimento ha sido agregado con éxito.`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error al agregar el costo del alimento:', err);
        if (err.status === 500) {
          console.error('Error del servidor:', err.message);
          Swal.fire({
            icon: 'error',
            title: 'Error del servidor',
            text: 'No se pudo agregar el alimento. Inténtalo de nuevo.',
          });
        }
      }
    });
  }

  DatosCost(cost: FoodCost): void {
    this.isModalEdit = true;
    this.costToEdit = {
      idFoodCosts: cost.idFoodCosts,
      weekNumber: cost.weekNumber,
      foodType: cost.foodType,
      gramsPerChicken: cost.gramsPerChicken,
      unitPrice: ''
    };
  }

  updateCosto(): void {
    if (this.costToEdit) {
      const updateData: UpdateCost = {
        idFoodCosts: this.costToEdit.idFoodCosts,
        weekNumber: this.costToEdit.weekNumber,
        foodType: this.costToEdit.foodType,
        gramsPerChicken: this.costToEdit.gramsPerChicken,
        unitPrice: this.costToEdit.unitPrice || '0'
      };

      this.costService.updateCost(this.costToEdit.idFoodCosts, updateData).subscribe({
        next: (data) => {
          console.log('Costo de alimento actualizado:', data);
          this.getCostFoods();
          this.showInactive = false;
          this.isModalEdit = false;
          Swal.fire({
            icon: 'success',
            title: 'Costo de Alimento actualizado',
            text: `El costo de alimento ha sido actualizado con éxito.`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al actualizar el costo de alimento:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error del servidor',
            text: 'No se pudo agregar el costo de alimento. Inténtalo de nuevo.',
          });
        }
      });
    }
  }

  filterByWeekNumber(): void {
    if (this.costWeekNumberFilter.trim()) {
      this.costService.getFoodCostByWeekNumber(this.costWeekNumberFilter).subscribe({
        next: (data: FoodCost[]) => {
          this.filteredCostFoods = data;
          this.currentPage = 1;
        },
        error: (err) => {
          console.error('Error al filtrar por semana:', err);
          this.filteredCostFoods = [];
        }
      });
    } else {
      this.filteredCostFoods = [];
      this.currentPage = 1;
    }
  }

  deleteCost(): void {
    if (this.costIdToDelete !== null) {
      console.log(`Desactivando el costo de alimento con ID: ${this.costIdToDelete}`);
      this.costService.deleteCost(this.costIdToDelete).subscribe({
        next: (data) => {
          console.log('Respuesta del servidor:', data);
          this.getCostFoods();
          this.isModalDelete = false;
          Swal.fire({
            icon: 'success',
            title: 'Costo de Alimento desactivado',
            text: `El costo de alimento ha sido desactivado correctamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al desactivar el costo de alimento:', err);
          console.error('Detalles del error:', err.error);
          Swal.fire({
            icon: 'error',
            title: 'Error al desactivar',
            text: 'Hubo un problema al intentar desactivar el costo de alimento.',
          });
        }
      });
    }
  }

  restoreCost(): void {
    if (this.costIdToRestore !== null) {
      console.log(`Restaurando el precio de alimento con ID: ${this.costIdToRestore}`);
      this.costService.reactivateCost(this.costIdToRestore).subscribe({
        next: (data) => {
          console.log('Respuesta del servidor:', data);
          this.getCostFoods();
          this.isModalRestore = false;
          Swal.fire({
            icon: 'success',
            title: 'Costo de Alimento restaurado',
            text: `El costo de alimento ha sido restaurado correctamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al restaurar el costo de alimento:', err);
          console.error('Detalles del error:', err.error);
          Swal.fire({
            icon: 'error',
            title: 'Error al restaurar',
            text: 'Hubo un problema al intentar restaurar el costo de alimento.',
          });
        }
      });
    }
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Costo de Alimentos');

    // Define columns
    worksheet.columns = [
      { header: 'Semana', key: 'weekNumber', width: 20 },
      { header: 'Tipo', key: 'foodType', width: 20 },
      { header: 'gr/gallina', key: 'gramsPerChicken', width: 15 },
      { header: 'Total (kg)', key: 'totalKg', width: 15 },
      { header: 'Costo Total', key: 'totalCost', width: 15 },
      { header: 'Fecha de Inicio', key: 'startDate', width: 15 },
      { header: 'Fecha Final', key: 'endDate', width: 15 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light gray background
    };

    // Add data rows
    const data = this.filteredCostFoods.length > 0
      ? this.filteredCostFoods
      : (this.showInactive ? this.costInactive : this.costActive);

    data.forEach(foodCost => {
      worksheet.addRow({
        weekNumber: foodCost.weekNumber,
        foodType: foodCost.foodType,
        gramsPerChicken: foodCost.gramsPerChicken,
        totalKg: foodCost.totalKg,
        totalCost: foodCost.totalCost,
        startDate: foodCost.startDate ? new Date(foodCost.startDate).toLocaleDateString() : '',
        endDate: foodCost.endDate ? new Date(foodCost.endDate).toLocaleDateString() : '',
        status: foodCost.status
      });
    });

    // Auto-filter the header row
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 }
    };

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Costo_Alimentos.xlsx');
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF();

    doc.text('Lista de Costo de Alimentos', 10, 10);

    const tableData = (this.filteredCostFoods.length > 0 ? this.filteredCostFoods : (this.showInactive ? this.costInactive : this.costActive))
      .map(foodCost => [
        foodCost.weekNumber,
        foodCost.foodType,
        foodCost.gramsPerChicken,
        foodCost.totalKg,
        foodCost.totalCost,
        foodCost.startDate ? new Date(foodCost.startDate).toLocaleDateString() : '',
        foodCost.endDate ? new Date(foodCost.endDate).toLocaleDateString() : '',
        foodCost.status,
      ]);

    autoTable(doc, {
      head: [['Semana', 'Tipo', 'gr/gallina', 'Total (kg)', 'Costo Total', 'Fecha de Inicio', 'Fecha Final', 'Estado']],
      body: tableData,
    });

    // Genera el archivo PDF
    doc.save('Costo_Alimentos.pdf');
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isModalEdit = false;
    this.isModalDelete = false;
    this.isModalRestore = false;
    this.costIdToRestore = null;
    this.costIdToDelete = null;
    this.resetForm();

  }

  resetForm(): void {
    this.newCostFood = {} as InsertCost;
    this.costToEdit = {} as UpdateCost;
    this.selectedFeedType = '';
  }

  validateGrGallina(gramsPerChicken: string): boolean {
    const regex = /^\d+$/;
    return regex.test(gramsPerChicken);
  }

  validateUnitPrice(unitPrice: string): boolean {
    const regex = /^\d+(\.\d+)?$/;
    return regex.test(unitPrice);
  }

}
