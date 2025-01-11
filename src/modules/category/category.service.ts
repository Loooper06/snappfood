import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity';
import { Repository } from 'typeorm';
import { S3Service } from '../s3/s3.service';
import {
  ConflictMessage,
  NotFoundMessage,
  PublicMessage,
} from 'src/common/enums/message.enum';
import { isBoolean, toBoolean } from 'src/common/utils/functions.util';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import {
  paginationGenerator,
  paginationSolver,
} from 'src/common/utils/pagination.util';
import { MulterFile } from 'src/common/types/file.type';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private s3Service: S3Service,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, image: MulterFile) {
    const { Location, Key } = await this.s3Service.uploadFile(
      image,
      'snappfood-image',
    );
    try {
      let { title, slug, show, parentId } = createCategoryDto;
      const category = await this.findOneBySlug(slug);
      if (category) throw new ConflictException(ConflictMessage.CategoryTitle);
      if (isBoolean(show)) show = toBoolean(show);

      let parent: CategoryEntity = null;
      if (parentId && !isNaN(parseInt(parentId.toString())))
        parent = await this.findOneById(+parentId);

      await this.categoryRepository.insert({
        title,
        slug,
        show,
        image: Location,
        imageKey: Key,
        parentId: parent?.id || null,
      });
      return { message: PublicMessage.Created };
    } catch (err) {
      await this.s3Service.deleteFile(Key);
      throw err;
    }
  }
  async findAll(paginationDto: PaginationDto) {
    const { page, skip, limit } = paginationSolver(paginationDto);
    const [categories, count] = await this.categoryRepository.findAndCount({
      where: {},
      relations: {
        parent: true,
      },
      select: {
        parent: {
          title: true,
          image: true,
        },
      },
      take: limit,
      skip,
      order: { id: 'DESC' },
    });

    return { pagination: paginationGenerator(count, page, limit), categories };
  }
  async findOneById(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category)
      throw new NotFoundException(NotFoundMessage.NotFoundCategory);
    return category;
  }
  async findOneBySlug(slug: string) {
    return await this.categoryRepository.findOneBy({ slug });
  }
  async findBySlug(slug: string) {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: {
        children: {
          children: true,
        },
      },
    });
    if (!category) throw new NotFoundException(NotFoundMessage.Any);
    return { category };
  }
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    image: MulterFile,
  ) {
    const { title, parentId, show, slug } = updateCategoryDto;
    const category = await this.findOneById(id);
    if (title) category.title = title;
    if (parentId) category.parentId = parentId;
    if (show && isBoolean(show)) category.show = toBoolean(show);
    if (slug) {
      const existingCategory = await this.findOneBySlug(slug);
      if (existingCategory && existingCategory.id !== id)
        throw new ConflictException(ConflictMessage.CategoryTitle);
      category.slug = slug;
    }
    if (parentId && !isNaN(parseInt(parentId.toString()))) {
      const parent = await this.findOneById(+parentId);
      category.parentId = parent.id;
    }

    let Location: string = null,
      Key: string = null,
      previousImageKey: string = category?.imageKey || null;
    if (image) {
      const result = await this.s3Service.uploadFile(image, 'snappfood-image');
      Location = result?.Location || null;
      Key = result?.Key || null;
      category.image = Location;
      category.imageKey = Key;
    }

    try {
      await this.categoryRepository.save(category);
    } catch (err) {
      await this.s3Service.deleteFile(Key);
      throw err;
    }

    if (image && !!Location && !!Key && previousImageKey)
      await this.s3Service.deleteFile(previousImageKey);

    return {
      message: PublicMessage.Updated,
    };
  }
  async remove(id: number) {
    const category = await this.findOneById(id);
    try {
      await this.categoryRepository.delete(category);
    } catch (err) {
      throw err;
    }
    if (!!category?.imageKey)
      await this.s3Service.deleteFile(category?.imageKey);
    return { message: PublicMessage.Deleted };
  }
}
