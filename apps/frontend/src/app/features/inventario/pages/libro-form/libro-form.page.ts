import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogoService } from '../../services/catalogo.service';
import { Categoria, Editorial } from '../../models/libro.model';

@Component({
  selector: 'app-libro-form',
  imports: [ReactiveFormsModule],
  templateUrl: './libro-form.page.html',
  styleUrl: './libro-form.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibroFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly catalogoService = inject(CatalogoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  libroId = signal<string | null>(null);
  editoriales = signal<Editorial[]>([]);
  categorias = signal<Categoria[]>([]);
  guardando = signal(false);
  errorMensaje = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2)]],
    isbn: ['', [Validators.required, Validators.minLength(10)]],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    precioCosto: [0, [Validators.required, Validators.min(0)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [5, [Validators.required, Validators.min(0)]],
    editorialId: ['', Validators.required],
    categoriaId: ['', Validators.required]
  });

  get esEdicion(): boolean {
    return this.libroId() !== null;
  }

  constructor() {
    this.catalogoService.listarEditoriales().subscribe((data) => this.editoriales.set(data));
    this.catalogoService.listarCategorias().subscribe((data) => this.categorias.set(data));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.libroId.set(id);
      this.catalogoService.obtenerLibro(id).subscribe((libro) => {
        this.form.patchValue({
          titulo: libro.titulo,
          isbn: libro.isbn,
          precioVenta: libro.precioVenta,
          precioCosto: libro.precioCosto,
          stockActual: libro.stockActual,
          stockMinimo: libro.stockMinimo,
          editorialId: libro.editorialId,
          categoriaId: libro.categoriaId
        });
        this.form.controls.isbn.disable();
        this.form.controls.stockActual.disable();
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);
    const valores = this.form.getRawValue();

    const peticion = this.esEdicion
      ? this.catalogoService.actualizarLibro(this.libroId()!, valores)
      : this.catalogoService.crearLibro(valores);

    peticion.subscribe({
      next: () => this.router.navigate(['/inventario']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorMensaje.set(
          err.status === 409 ? 'Ya existe un libro con ese ISBN.' : 'No se pudo guardar el libro.'
        );
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/inventario']);
  }
}
