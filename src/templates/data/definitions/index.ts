import { restaurantModernTemplate } from './restaurant-modern';
import { cafeArtisanTemplate } from './cafe-artisan';
import { dentalClinicTemplate } from './dental-clinic';
import { healthcarePrivateTemplate } from './healthcare-private';
import { salonPremiumTemplate } from './salon-premium';
import { wellnessSpaTemplate } from './wellness-spa';
import { fitnessStudioTemplate } from './fitness-studio';
import { realEstateConsultantTemplate } from './real-estate-consultant';
import { architectureStudioTemplate } from './architecture-studio';
import { interiorDesignLuxuryTemplate } from './interior-design-luxury';
import { photographerProTemplate } from './photographer-pro';
import { agencyDigitalCreativeTemplate } from './agency-digital-creative';
import { saasSoftwareTemplate } from './saas-software';
import { businessConsultantTemplate } from './business-consultant';
import { lawFirmTemplate } from './law-firm';
import { coachingInstituteTemplate } from './coaching-institute';
import { schoolModernTemplate } from './school-modern';
import { hotelBoutiqueTemplate } from './hotel-boutique';
import { travelAgencyTemplate } from './travel-agency';
import { automotiveDetailingTemplate } from './automotive-detailing';
import { TemplateMetadata } from '../../../documents/types/document.types';

export const ALL_NICHE_TEMPLATES = [
  restaurantModernTemplate,
  cafeArtisanTemplate,
  dentalClinicTemplate,
  healthcarePrivateTemplate,
  salonPremiumTemplate,
  wellnessSpaTemplate,
  fitnessStudioTemplate,
  realEstateConsultantTemplate,
  architectureStudioTemplate,
  interiorDesignLuxuryTemplate,
  photographerProTemplate,
  agencyDigitalCreativeTemplate,
  saasSoftwareTemplate,
  businessConsultantTemplate,
  lawFirmTemplate,
  coachingInstituteTemplate,
  schoolModernTemplate,
  hotelBoutiqueTemplate,
  travelAgencyTemplate,
  automotiveDetailingTemplate,
] as TemplateMetadata[];

export const TEMPLATES_BY_ID = new Map<string, TemplateMetadata>(
  ALL_NICHE_TEMPLATES.map((t) => [t.id, t]),
);

export const TEMPLATES_BY_SLUG = new Map<string, TemplateMetadata>(
  ALL_NICHE_TEMPLATES.map((t) => [t.slug, t]),
);
