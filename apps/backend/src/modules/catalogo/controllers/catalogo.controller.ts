// src/modules/catalogo/controllers/catalogo.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Delete,
  Patch,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { CatalogoService } from '../services/catalogo.service';
import { QueryLibroDto } from '../dto/query-libro.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateLibroDto } from '../dto/create-libro.dto';
import { UpdateLibroDto } from '../dto/update-libro.dto';
import { CreateAutorDto } from '../dto/create-autor.dto';
import { UpdateAutorDto } from '../dto/update-autor.dto';
import { CreateEditorialDto } from '../dto/create-editorial.dto';
import { UpdateEditorialDto } from '../dto/update-editorial.dto';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';
import { UpdateCategoriaDto } from '../dto/update-categoria.dto';

const TAMANO_MAXIMO_PORTADA = 2 * 1024 * 1024; // 2MB

@ApiTags('catalogo')
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Public()
  @Get('libros')
  findAll(@Query() query: QueryLibroDto, @Req() req: Request) {
    return this.catalogoService.findAll(query, this.baseUrl(req));
  }

  @Public()
  @Get('libros/:id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.catalogoService.findOne(id, this.baseUrl(req));
  }

  @Roles('admin')
  @Post('libros')
  create(@Body() dto: CreateLibroDto, @Req() req: Request) {
    return this.catalogoService.create(dto, this.baseUrl(req));
  }

  @Roles('admin')
  @Patch('libros/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLibroDto,
    @Req() req: Request,
  ) {
    return this.catalogoService.update(id, dto, this.baseUrl(req));
  }

  @Roles('admin')
  @Delete('libros/:id')
  remove(@Param('id') id: string) {
    return this.catalogoService.remove(id);
  }

  @Roles('admin')
  @Post('libros/:id/portada')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('archivo'))
  subirPortada(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: TAMANO_MAXIMO_PORTADA,
            message: 'La imagen excede el tamaño máximo de 2MB',
          }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    archivo: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.catalogoService.actualizarPortada(id, archivo, this.baseUrl(req));
  }

  @Roles('admin')
  @Delete('libros/:id/portada')
  eliminarPortada(@Param('id') id: string, @Req() req: Request) {
    return this.catalogoService.eliminarPortada(id, this.baseUrl(req));
  }

  @Public()
  @Get('autores')
  findAllAutores() {
    return this.catalogoService.findAllAutores();
  }

  @Roles('admin')
  @Post('autores')
  createAutor(@Body() dto: CreateAutorDto) {
    return this.catalogoService.createAutor(dto);
  }

  @Roles('admin')
  @Patch('autores/:id')
  updateAutor(@Param('id') id: string, @Body() dto: UpdateAutorDto) {
    return this.catalogoService.updateAutor(id, dto);
  }

  @Roles('admin')
  @Delete('autores/:id')
  removeAutor(@Param('id') id: string) {
    return this.catalogoService.removeAutor(id);
  }

  @Public()
  @Get('editoriales')
  findAllEditoriales() {
    return this.catalogoService.findAllEditoriales();
  }

  @Roles('admin')
  @Post('editoriales')
  createEditorial(@Body() dto: CreateEditorialDto) {
    return this.catalogoService.createEditorial(dto);
  }

  @Roles('admin')
  @Patch('editoriales/:id')
  updateEditorial(@Param('id') id: string, @Body() dto: UpdateEditorialDto) {
    return this.catalogoService.updateEditorial(id, dto);
  }

  @Roles('admin')
  @Delete('editoriales/:id')
  removeEditorial(@Param('id') id: string) {
    return this.catalogoService.removeEditorial(id);
  }

  @Public()
  @Get('categorias')
  findAllCategorias() {
    return this.catalogoService.findAllCategorias();
  }

  @Roles('admin')
  @Post('categorias')
  createCategoria(@Body() dto: CreateCategoriaDto) {
    return this.catalogoService.createCategoria(dto);
  }

  @Roles('admin')
  @Patch('categorias/:id')
  updateCategoria(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.catalogoService.updateCategoria(id, dto);
  }

  @Roles('admin')
  @Delete('categorias/:id')
  removeCategoria(@Param('id') id: string) {
    return this.catalogoService.removeCategoria(id);
  }

  @Roles('admin', 'cajero')
  @Get('stock-bajo')
  findStockBajo() {
    return this.catalogoService.findStockBajo();
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }
}
