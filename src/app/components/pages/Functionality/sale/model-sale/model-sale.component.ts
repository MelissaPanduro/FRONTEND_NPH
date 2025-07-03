import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Sale } from '../../../../../../interfaces/Sale';
import { SaleDetail } from '../../../../../../interfaces/Sale';
import { SaleService } from '../../../../../../service/sale.service';
import { ProductService } from '../../../../../../service/product.service';
import { Product } from '../../../../../../interfaces/Product';
import { forkJoin, Observable, debounceTime, distinctUntilChanged } from 'rxjs';

interface ProductQuantity {
  productId: number;
  quantity: number;
  product: Product;
}

@Component({
  selector: 'app-model-sale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './model-sale.component.html',
  styleUrls: ['./model-sale.component.css']
})
export class ModelSaleComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() saleData: Sale | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saleCreated = new EventEmitter<Sale>();
  @Output() saleUpdated = new EventEmitter<Sale>();

  saleForm: FormGroup;
  products: Product[] = [];
  availableProductsForType: Product[] = [];
  selectedProducts: Product[] = [];
  selectedProductQuantities: Map<number, number> = new Map();

  isLoading: boolean = false;
  errorMessage: string = '';
  originalSaleData: Sale | null = null;
  isSearchingDocument: boolean = false;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService
  ) {
    this.saleForm = this.createForm();
    this.loadProducts();
    this.setupDocumentSearchListener();
  }


ngOnChanges(): void {
  if (this.isOpen) {
    this.errorMessage = '';
    
    // Solo limpiar productos en modo create
    if (this.mode === 'create') {
      this.selectedProducts = [];
      this.selectedProductQuantities.clear();
      this.availableProductsForType = [];
    }

    if (this.mode === 'view') {
      this.saleForm.disable();
    } else {
      this.saleForm.enable();
      this.saleForm.get('totalPrice')?.disable();
    }

    this.loadProducts(this.mode !== 'view');

    if ((this.mode === 'edit' || this.mode === 'view') && this.saleData) {
      this.originalSaleData = { ...this.saleData };

      const pricePerKg = this.saleData.details?.[0]?.pricePerKg ?? 0;
      const totalPrice = this.getTotalPriceFromDetails(this.saleData.details ?? []);

      this.saleForm.patchValue({
        id: this.saleData.id,
        saleDate: this.formatDateForInput(this.saleData.saleDate),
        name: this.saleData.name,
        ruc: this.saleData.ruc,
        address: this.saleData.address,
        pricePerKg: pricePerKg,
        totalPrice: totalPrice.toFixed(2)
      });

      // Cargar primero los productos disponibles para el tipo
      this.loadSelectedProductsForEdit();
      
      // Luego cargar las cantidades existentes
      this.loadExistingQuantities(this.saleData.details ?? []);
      
    } else if (this.mode === 'create') {
      this.saleForm = this.createForm();
      this.saleForm.get('id')?.setValue(null);
      this.originalSaleData = null;
      this.setupDocumentSearchListener();
    }

    if (this.mode !== 'create') {
      this.calculateTotals();
    }
  }
}

  // ========================
  // MÉTODOS PARA MANEJAR CANTIDADES DE PRODUCTOS
  // ========================

  /**
   * Obtiene la cantidad seleccionada de un producto específico
   */
  getProductQuantity(productId: number): number {
    return this.selectedProductQuantities.get(productId) || 0;
  }

  /**
   * Obtiene el stock disponible de un producto específico
   */
  getProductStock(productId: number): number {
    const product = this.allProductsInStock.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  /**
   * Incrementa la cantidad de un producto
   */
  increaseProductQuantity(productId: number): void {
    const currentQuantity = this.getProductQuantity(productId);
    const maxStock = this.getProductStock(productId);
    
    if (currentQuantity < maxStock) {
      this.selectedProductQuantities.set(productId, currentQuantity + 1);
      this.updateSelectedProducts();
      this.calculateTotals();
    }
  }

  /**
   * Decrementa la cantidad de un producto
   */
  decreaseProductQuantity(productId: number): void {
    const currentQuantity = this.getProductQuantity(productId);
    
    if (currentQuantity > 0) {
      const newQuantity = currentQuantity - 1;
      if (newQuantity === 0) {
        this.selectedProductQuantities.delete(productId);
      } else {
        this.selectedProductQuantities.set(productId, newQuantity);
      }
      this.updateSelectedProducts();
      this.calculateTotals();
    }
  }

  /**
   * Establece una cantidad específica para un producto
   */
  setProductQuantity(productId: number, quantity: number): void {
    const maxStock = this.getProductStock(productId);
    const validQuantity = Math.min(Math.max(0, quantity), maxStock);
    
    if (validQuantity === 0) {
      this.selectedProductQuantities.delete(productId);
    } else {
      this.selectedProductQuantities.set(productId, validQuantity);
    }
    
    this.updateSelectedProducts();
    this.calculateTotals();
  }

  /**
   * Actualiza la lista de productos seleccionados basada en las cantidades
   */
  updateSelectedProducts(): void {
    this.selectedProducts = [];
    
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product && quantity > 0) {
        // Agregar cada paquete individual como era antes
        for (let i = 0; i < quantity; i++) {
          this.selectedProducts.push(product);
        }
      }
    });
  }

  /**
   * Obtiene el peso total de un producto específico seleccionado
   */
  getProductTotalWeight(productId: number): number {
    const quantity = this.getProductQuantity(productId);
    const product = this.allProductsInStock.find(p => p.id === productId);
    return product ? (quantity * product.packageWeight) : 0;
  }

  /**
   * Obtiene el precio total de un producto específico seleccionado
   */
  getProductTotalPrice(productId: number): string {
    const totalWeight = this.getProductTotalWeight(productId);
    const pricePerKg = this.saleForm.get('pricePerKg')?.value || 0;
    const totalPrice = totalWeight * pricePerKg;
    return totalPrice.toFixed(2);
  }

  /**
   * Obtiene el total de productos seleccionados (suma de cantidades)
   */
  getTotalSelectedProducts(): number {
    let total = 0;
    this.selectedProductQuantities.forEach(quantity => {
      total += quantity;
    });
    return total;
  }

  /**
   * Inicializa las cantidades al cargar datos existentes (para modo edición)
   */
  loadExistingQuantities(saleDetails: SaleDetail[]): void {
    this.selectedProductQuantities.clear();
    
    // Contar cantidades por producto
    const productCounts = new Map<number, number>();
    
    saleDetails.forEach(detail => {
      const currentCount = productCounts.get(detail.productId) || 0;
      productCounts.set(detail.productId, currentCount + detail.packages);
    });
    
    // Establecer las cantidades
    productCounts.forEach((quantity, productId) => {
      this.selectedProductQuantities.set(productId, quantity);
    });
    
    this.updateSelectedProducts();
  }

  /**
   * Convierte las cantidades seleccionadas a SaleDetail[] para guardar
   */
  convertToSaleDetails(): SaleDetail[] {
    const saleDetails: SaleDetail[] = [];
    const pricePerKg = this.saleForm.get('pricePerKg')?.value || 0;
    
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product && quantity > 0) {
        const totalWeight = quantity * product.packageWeight;
        const totalPrice = totalWeight * pricePerKg;
        
        saleDetails.push({
          productId: productId,
          weight: product.packageWeight,
          packages: quantity,
          totalWeight: totalWeight,
          pricePerKg: pricePerKg,
          totalPrice: totalPrice
        });
      }
    });
    
    return saleDetails;
  }

  // ========================
  // MÉTODOS ORIGINALES ADAPTADOS
  // ========================

  private getTotalPriceFromDetails(details: SaleDetail[]): number {
    return details.reduce((sum, d) => sum + (d.totalWeight * d.pricePerKg), 0);
  }

  // Validadores personalizados
  private nameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/;
    if (!nameRegex.test(control.value)) {
      return { invalidName: true };
    }
    return null;
  }

  private documentValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const value = control.value.toString();
    const isDni = /^\d{8}$/.test(value);
    const isRuc = /^\d{11}$/.test(value);
    
    if (!isDni && !isRuc) {
      return { invalidDocument: true };
    }
    return null;
  }

  createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      saleDate: [this.getCurrentDate(), Validators.required],
      name: ['', [Validators.required, this.nameValidator]],
      ruc: ['', [Validators.required, this.documentValidator]],
      address: ['', Validators.required],
      pricePerKg: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0.01)]],
      totalPrice: [{ value: 0, disabled: true }]
    });
  }

  private setupDocumentSearchListener(): void {
    const rucControl = this.saleForm.get('ruc');
    if (rucControl) {
      rucControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && this.isValidDocument(value)) {
          this.searchByDocument(value);
        }
      });
    }
  }

  private isValidDocument(document: string): boolean {
    const isDni = /^\d{8}$/.test(document);
    const isRuc = /^\d{11}$/.test(document);
    return isDni || isRuc;
  }

  private searchByDocument(document: string): void {
    this.isSearchingDocument = true;

    this.saleService.getSalesByRuc(document).subscribe({
      next: (sales: Sale[]) => {
        const existingSale = sales[0];
        if (existingSale) {
          this.saleForm.patchValue({
            name: existingSale.name,
            address: existingSale.address
          });
        }
        this.isSearchingDocument = false;
      },
      error: (error: any) => {
        console.log('No se encontró venta con ese documento, se puede crear nueva');
        this.isSearchingDocument = false;
      }
    });
  }

  // Métodos para manejo de productos
  loadProducts(filterPTOnly: boolean = false): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        if (filterPTOnly) {
          this.products = products.filter(
            product =>
              product.typeProduct === 'PT' &&
              product.status === 'A' &&
              product.stock > 0
          );
        } else {
          this.products = products;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
        this.errorMessage = 'No se pudieron cargar los productos. Por favor, intente nuevamente.';
      }
    });
  }

  get allProductsInStock(): Product[] {
    return this.products.filter(
      p => p.typeProduct === 'PT' && p.status === 'A' && p.stock > 0
    );
  }

  getUniqueProductTypes(): string[] {
    const types = [...new Set(this.products.map(p => p.type))];
    return types.sort();
  }

  onProductTypeChange(event: any): void {
    const selectedType = event.target.value;
    this.selectedProducts = [];
    this.selectedProductQuantities.clear();
    
    if (selectedType) {
      this.availableProductsForType = this.products
        .filter(p => p.type === selectedType && p.stock > 0)
        .sort((a, b) => a.packageWeight - b.packageWeight);
    } else {
      this.availableProductsForType = [];
    }
    
    this.calculateTotals();
  }

  onProductSelection(product: Product, event: any): void {
    if (event.target.checked) {
      if (!this.isProductSelected(product.id)) {
        this.setProductQuantity(product.id, 1);
        this.saleForm.patchValue({ typeProduct: product.typeProduct });
      }
    } else {
      this.setProductQuantity(product.id, 0);
    }
  }

  isProductSelected(productId: number): boolean {
    return this.getProductQuantity(productId) > 0;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getSelectedWeightsList(): string {
    const weights: string[] = [];
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product && quantity > 0) {
        weights.push(`${product.packageWeight}kg x${quantity}`);
      }
    });
    return weights.join(', ');
  }

  // Método actualizado para usar el Map
  getTotalSelectedWeight(): number {
    let totalWeight = 0;
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product) {
        totalWeight += quantity * product.packageWeight;
      }
    });
    return Math.round(totalWeight * 100) / 100;
  }

  getTotalStock(): number {
    return this.products?.reduce((total, product) => total + (product.stock || 0), 0) || 0;
  }

private loadSelectedProductsForEdit(): void {
  if (this.saleData && this.mode !== 'create' && this.saleData.details?.length > 0) {
    const firstDetail = this.saleData.details[0];
    const selectedProduct = this.products.find(p => p.id === firstDetail.productId);

    if (selectedProduct) {
      this.saleForm.patchValue({
        typeProduct: selectedProduct.typeProduct,
        pricePerKg: firstDetail.pricePerKg,
        totalPrice: firstDetail.totalPrice
      });

      // Cargar productos disponibles para el tipo
      this.availableProductsForType = this.products
        .filter(p => p.type === selectedProduct.type && p.stock > 0)
        .sort((a, b) => a.packageWeight - b.packageWeight);

      // Para modo edit, también incluir productos que ya no tienen stock pero están en la venta
      if (this.mode === 'edit') {
        const productIdsInSale = this.saleData.details?.map(d => d.productId) || [];
        const additionalProducts = this.products.filter(p => 
          p.type === selectedProduct.type && 
          productIdsInSale.includes(p.id) && 
          !this.availableProductsForType.some(ap => ap.id === p.id)
        );
        
        this.availableProductsForType = [...this.availableProductsForType, ...additionalProducts]
          .sort((a, b) => a.packageWeight - b.packageWeight);
      }
    }
  }
}

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return this.getCurrentDate();
    return dateString.split('T')[0];
  }

  calculateTotals(): void {
    const pricePerKg = parseFloat(this.saleForm.get('pricePerKg')?.value) || 0;
    const totalWeight = this.getTotalSelectedWeight();
    const totalPrice = totalWeight * pricePerKg;

    this.saleForm.patchValue({
      totalPrice: totalPrice.toFixed(2)
    });
  }

  // Métodos para obtener mensajes de error específicos
  getFieldError(fieldName: string): string {
    const field = this.saleForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors?.['invalidName']) {
        return 'El nombre solo puede contener letras, espacios y ñ';
      }
      if (field.errors?.['invalidDocument']) {
        return 'Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido';
      }
      if (field.errors?.['min']) {
        return `${this.getFieldDisplayName(fieldName)} debe ser mayor a 0`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Nombre',
      'ruc': 'Documento',
      'address': 'Dirección',
      'typeProduct': 'Tipo de Producto',
      'pricePerKg': 'Precio por Kg',
      'saleDate': 'Fecha de venta'
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.saleForm.invalid || this.getTotalSelectedProducts() === 0) {
      this.saleForm.markAllAsTouched();
      this.errorMessage = 'Debe completar todos los campos requeridos y seleccionar al menos un producto.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formData = this.prepareFormData();

    if (this.mode === 'create') {
      this.createSaleWithStockUpdate(formData);
    } else if (this.mode === 'edit') {
      this.updateSaleWithStockUpdate(formData);
    }
  }


private createSaleWithStockUpdate(sale: Sale): void {
  this.saleService.createSale(sale).subscribe({
    next: (createdSale: Sale) => {
      const stockUpdates: Observable<any>[] = [];
      
      this.selectedProductQuantities.forEach((quantity, productId) => {
        // Buscar el producto en la lista de productos disponibles
        const product = this.products.find(p => p.id === productId);
        if (product && quantity > 0) {
          console.log(`Reduciendo stock del producto ${product.id} en ${quantity} unidades`);
          // Usar reduceStock que ya tienes en el servicio
          stockUpdates.push(this.productService.reduceStock(productId, quantity));
        }
      });

      if (stockUpdates.length > 0) {
        forkJoin(stockUpdates).subscribe({
          next: () => {
            this.saleCreated.emit(createdSale);
            this.isLoading = false;
            this.closeModal.emit();
          },
          error: (err) => {
            console.error('Error detallado:', err);
            this.errorMessage = `Error al actualizar stock: ${err.message || JSON.stringify(err)}`;
            this.isLoading = false;
          }
        });
      } else {
        this.saleCreated.emit(createdSale);
        this.isLoading = false;
        this.closeModal.emit();
      }
    },
    error: (err) => {
      console.error('Error al crear venta:', err);
      this.errorMessage = `Error al crear venta: ${err.message || JSON.stringify(err)}`;
      this.isLoading = false;
    }
  });
}

private updateSaleWithStockUpdate(saleData: Sale): void {
  if (saleData.id == null) {
    this.errorMessage = 'ID de la venta no válido';
    this.isLoading = false;
    return;
  }

  // Para edición, necesitamos manejar los cambios de stock de manera diferente
  const stockOperations: Observable<any>[] = [];
  
  // Obtener las cantidades originales
  const originalQuantities = new Map<number, number>();
  if (this.originalSaleData?.details) {
    this.originalSaleData.details.forEach(detail => {
      const currentCount = originalQuantities.get(detail.productId) || 0;
      originalQuantities.set(detail.productId, currentCount + detail.packages);
    });
  }

  // Comparar con las nuevas cantidades y ajustar stock según sea necesario
  this.selectedProductQuantities.forEach((newQuantity, productId) => {
    const originalQuantity = originalQuantities.get(productId) || 0;
    const difference = newQuantity - originalQuantity;
    
    if (difference !== 0) {
      // Buscar el producto en la lista de productos disponibles
      const product = this.products.find(p => p.id === productId);
      if (product) {
        if (difference > 0) {
          // Se aumentó la cantidad, reducir más stock
          console.log(`Reduciendo stock adicional del producto ${productId} en ${difference} unidades`);
          stockOperations.push(this.productService.reduceStock(productId, difference));
        } else {
          // Se redujo la cantidad, devolver stock
          console.log(`Devolviendo stock del producto ${productId} en ${Math.abs(difference)} unidades`);
          stockOperations.push(this.productService.increaseStock(productId, Math.abs(difference)));
        }
      }
    }
  });

  // Verificar productos que fueron removidos completamente
  originalQuantities.forEach((originalQuantity, productId) => {
    if (!this.selectedProductQuantities.has(productId)) {
      // Este producto fue removido completamente, devolver todo su stock
      console.log(`Devolviendo todo el stock del producto ${productId}: ${originalQuantity} unidades`);
      stockOperations.push(this.productService.increaseStock(productId, originalQuantity));
    }
  });

  // Actualizar la venta
  const updateSale$ = this.saleService.updateSale(saleData.id, saleData);

  // Ejecutar todas las operaciones
  if (stockOperations.length > 0) {
    forkJoin([updateSale$, ...stockOperations]).subscribe({
      next: ([updatedSale, ...stockResults]) => {
        console.log('Venta actualizada y stock ajustado:', {
          updatedSale,
          operacionesStock: stockResults.length
        });
        this.saleUpdated.emit(updatedSale);
        this.handleClose();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar venta o ajustar stock:', error);
        this.errorMessage = `Error al actualizar: ${error.message || 'Error desconocido'}`;
        this.isLoading = false;
      }
    });
  } else {
    // Solo actualizar la venta si no hay cambios de stock
    updateSale$.subscribe({
      next: (updatedSale) => {
        console.log('Venta actualizada sin cambios de stock');
        this.saleUpdated.emit(updatedSale);
        this.handleClose();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar venta:', error);
        this.errorMessage = `Error al actualizar: ${error.message || 'Error desconocido'}`;
        this.isLoading = false;
      }
    });
  }
}

  // Método actualizado para usar convertToSaleDetails()
  prepareFormData(): Sale {
    const formValue = this.saleForm.getRawValue();
    const details = this.convertToSaleDetails();

    const saleData: Sale = {
      id: this.mode === 'edit' ? formValue.id : 0,
      saleDate: formValue.saleDate,
      name: formValue.name,
      ruc: formValue.ruc,
      address: formValue.address,
      details: details
    };

    return saleData;
  }
  

  handleClose(): void {
    if (this.saleForm.dirty && this.mode !== 'view') {
      const confirmExit = confirm('¿Seguro que deseas cerrar? Se perderán los cambios no guardados.');
      if (!confirmExit) return;
    }
    this.isLoading = false;
    this.errorMessage = '';
    this.selectedProducts = [];
    this.selectedProductQuantities.clear();
    this.availableProductsForType = [];
    this.closeModal.emit();
    this.saleForm.reset();
  }
}