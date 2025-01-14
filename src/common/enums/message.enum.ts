export enum BadRequestMessage {}

export enum AuthMessage {
  NotFoundAccount = 'حساب کاربری یافت نشد !',
  ConflictAccount = 'حساب کاربری قبلا ثبت شده است !',
  CodeExpired = 'کد تایید منقضی شده است ، مجددا تلاش نمایید',
  CodeNotExpired = 'کد تایید قبلی منقضی نشده است',
  TryAgain = 'مجددا تلاش نمایید',
  LoginAgain = 'مجددا وارد حساب کاربری خود شوید',
  RequiredLogin = 'وارد حساب کاربری خود شوید',
  SendOtp = 'کد یکبار مصرف با موفقیت برای شما ارسال شد',
  LoggedIn = 'ورود به حساب کاربری موفقیت آمیز یود',
}

export enum ConflictMessage {
  CategoryTitle = 'عنوان دسته بندی قبلا ثبت شده است',
  Email = 'ایمیل وارد شده نمی تواند ثبت شود',
  Phone = 'موبایل وارد شده نمی تواند ثبت شود',
  Username = 'نام کاربری وارد شده نمی تواند ثبت شود',
  Supplier = 'فروشگاهی قبلا با این شماره تماس ثبت شده است',
  SupplierNational_Code = 'فروشگاهی قبلا با این کد ملی ثبت شده است',
  SupplierEmail = 'فروشگاهی قبلا با این ایمیل ثبت شده است',
}

export enum NotFoundMessage {
  Any = 'موردی یافت نشد',
  NotFoundCategory = 'دسته بندی یافت نشد',
  NotFoundPost = 'مقاله ای یافت نشد',
  NotFoundUser = 'کاربری یافت نشد',
}

export enum ValidationMessage {
  InvalidImageFormat = 'فرمت تصویر انتخاب شده باید از نوع png ، jpg ، jpeg باشد',
  PHONE_INVALID = 'موبایل وارد شده معتبر نمی باشد',
  Invalid_Code = 'کد یکبار مصرف منقضی شده یا اشتباه است',
}

export enum PublicMessage {
  Created = 'با موفقیت ایجاد شد',
  Deleted = 'با موفقیت حذف شد',
  Updated = 'با موفقیت بروز رسانی شد',
  Inserted = 'با موفقیت اضافه شد',
  Uploaded = 'مدارک با موفقیت بارگذاری شد',
}

export enum ForbiddenMessage {
  Forbidden = 'شما مجاز به انجام این کار نیستید',
  Blocked = 'حساب کاربری شما مسدود می باشد لطفا با پشتیبانی در ارتباط باشید',
}
