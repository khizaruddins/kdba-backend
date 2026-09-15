import { ContactFormVariant, defaultContactFormProps } from '../contracts/form-fields';
import { WebsiteNode } from '../types/document.types';
import {
  IMG,
  button,
  card,
  column,
  divider,
  grid,
  heading,
  icon,
  image,
  link,
  n,
  paragraph,
  row,
  section,
  spacer,
  stack,
  text,
} from './block-helpers';

function leadForm(variant: ContactFormVariant): WebsiteNode {
  const props = defaultContactFormProps(variant);
  return n('form', props, [], undefined, variant);
}

function feature(title: string, body: string, iconName = 'sparkles'): WebsiteNode {
  return card([icon(iconName), heading(title, 3), paragraph(body)]);
}

function qa(question: string, answer: string): WebsiteNode {
  return stack([heading(question, 3), paragraph(answer)], undefined);
}

function plan(name: string, price: string, blurb: string, popular = false): WebsiteNode {
  return n('pricing', {
    planName: name,
    price,
    billingPeriod: 'per month',
    description: blurb,
    features: ['Custom pages', 'Responsive layouts', 'Lead capture', 'Publish workflow'],
    ctaLabel: `Choose ${name}`,
    ctaHref: '#contact',
    isPopular: popular,
  });
}

export const BLOCK_TREES: Record<string, () => WebsiteNode> = {
  'layout-section': () =>
    section('Section', 'layout-section', [stack([heading('New section', 2), paragraph('Add your content here.')])]),

  'layout-stack': () =>
    section('Stack', 'layout-stack', [stack([heading('Stacked content', 2), paragraph('A vertical layout you can restyle.')])]),

  'layout-two-column': () =>
    section(
      'Two columns',
      'layout-two-column',
      [
        row([
          column(6, [heading('Left column', 2), paragraph('Edit, move, or delete these nodes freely.')]),
          column(6, [heading('Right column', 2), paragraph('This is a normal document subtree.')]),
        ]),
      ],
    ),

  'layout-three-column': () =>
    section(
      'Three columns',
      'layout-three-column',
      [
        grid(3, [
          stack([heading('One', 3), paragraph('Column one.')]),
          stack([heading('Two', 3), paragraph('Column two.')]),
          stack([heading('Three', 3), paragraph('Column three.')]),
        ]),
      ],
    ),

  'hero-centered': () =>
    section(
      'Hero',
      'hero-centered',
      [
        stack(
          [
            heading('Grow a brand website you can actually edit', 1),
            paragraph('Reusable sections become normal document nodes the moment they land on the page.'),
            button('Get started'),
          ],
          { flex: { alignItems: 'center' }, typography: { textAlign: 'center' } },
        ),
      ],
    ),

  'hero-split': () =>
    section(
      'Hero',
      'hero-split',
      [
        row([
          column(6, [
            heading('Grow your business', 1),
            paragraph('A premium brand website with structured sections your team can actually edit.'),
            button('Get started'),
          ]),
          column(6, [image('Hero visual', IMG.studio)]),
        ]),
      ],
    ),

  'hero-image-left': () =>
    section(
      'Hero',
      'hero-image-left',
      [
        row([
          column(6, [image('Studio', IMG.interior)]),
          column(6, [
            heading('Designed for ambitious brands', 1),
            paragraph('Split layouts stay editable after insert — nothing is locked to the original block.'),
            button('Book a call'),
          ]),
        ]),
      ],
    ),

  'hero-image-right': () =>
    section(
      'Hero',
      'hero-image-right',
      [
        row([
          column(6, [
            heading('Launch with confidence', 1),
            paragraph('Every block expands into the same WebsiteDocument tree the editor already knows.'),
            button('See templates'),
          ]),
          column(6, [image('Launch visual', IMG.studio)]),
        ]),
      ],
    ),

  'hero-minimal': () =>
    section(
      'Hero',
      'hero-minimal',
      [
        stack([
          heading('A quieter opening', 1),
          paragraph('Headline, one sentence, one action.'),
          button('Continue', '#contact', 'secondary'),
        ]),
      ],
      { spacing: { padding: { top: '96px', bottom: '96px' } } },
    ),

  'about-split': () =>
    section(
      'About',
      'about-split',
      [
        row([
          column(6, [image('About the studio', IMG.interior)]),
          column(6, [
            heading('About the studio', 2),
            paragraph('We help ambitious brands launch websites that look considered and stay easy to maintain.'),
          ]),
        ]),
      ],
    ),

  'features-three-column': () =>
    section(
      'Features',
      'features-three-column',
      [
        heading('Why teams choose KDBA', 2),
        grid(3, [
          feature('Visual editing', 'Every change is a validated document operation.'),
          feature('Responsive by default', 'Tablet and mobile inherit desktop unless you override.'),
          feature('Theme tokens', 'Keep color and type consistent across the site.'),
        ]),
      ],
    ),

  'features-four-column': () =>
    section(
      'Features',
      'features-four-column',
      [
        heading('Everything you need to ship', 2),
        grid(4, [
          feature('Blocks', 'Insert a starting layout, then own every node.'),
          feature('Variants', 'Swap section layouts without a new form system.'),
          feature('Forms', 'One lead pipeline behind every contact layout.'),
          feature('Revisions', 'Operations stay atomic and revision-aware.'),
        ]),
      ],
    ),

  'features-icon-grid': () =>
    section(
      'Features',
      'features-icon-grid',
      [
        heading('Capabilities', 2),
        grid(3, [
          stack([icon('layout'), heading('Layouts', 3), paragraph('Section, container, row, column, grid, stack.')]),
          stack([icon('pen-tool'), heading('Content', 3), paragraph('Headings, copy, buttons, images, and links.')]),
          stack([icon('shield'), heading('Safety', 3), paragraph('No arbitrary CSS or JavaScript in the document.')]),
        ]),
      ],
    ),

  'features-bento': () =>
    section(
      'Features',
      'features-bento',
      [
        heading('A denser feature board', 2),
        grid(4, [
          n('stack', {}, [heading('Structured document', 3), paragraph('WebsiteDocument remains the source of truth.')], {
            grid: { columnSpan: 2 },
          }),
          stack([heading('Tokens', 3), paragraph('Color, type, radius, shadow, spacing.')]),
          stack([heading('Responsive', 3), paragraph('Desktop, tablet, and mobile overrides.')]),
          n('stack', {}, [heading('Ready for AI operations later', 3), paragraph('The same validated operations will be reusable.')], {
            grid: { columnSpan: 2 },
          }),
        ]),
      ],
    ),

  'features-alternating': () =>
    section(
      'Features',
      'features-alternating',
      [
        stack([
          row([
            column(6, [heading('Edit the tree, not a locked widget', 2), paragraph('Inserted blocks are regular nodes.')]),
            column(6, [image('Editing', IMG.studio)]),
          ]),
          spacer('32px'),
          row([
            column(6, [image('Layouts', IMG.interior)]),
            column(6, [heading('Layouts stay flexible', 2), paragraph('Move, duplicate, restyle, or delete any child.')]),
          ]),
        ]),
      ],
    ),

  'services-cards': () =>
    section(
      'Services',
      'services-cards',
      [
        heading('Services', 2),
        grid(3, [
          n('service', { title: 'Brand websites', description: 'Launch a polished marketing site from a structured document.', icon: 'globe' }),
          n('service', { title: 'Content systems', description: 'Reusable sections that stay on-brand as you grow.', icon: 'layers' }),
          n('service', { title: 'Launch support', description: 'Publish drafts without leaking editor state.', icon: 'rocket' }),
        ]),
      ],
    ),

  'services-list': () =>
    section(
      'Services',
      'services-list',
      [
        heading('Services', 2),
        stack([
          stack([heading('Strategy', 3), paragraph('Clarify the offer, the pages, and the conversion path.')]),
          divider(),
          stack([heading('Build', 3), paragraph('Assemble validated sections instead of one-off page code.')]),
          divider(),
          stack([heading('Launch', 3), paragraph('Promote a draft to published with revision history intact.')]),
        ]),
      ],
    ),

  'services-split': () =>
    section(
      'Services',
      'services-split',
      [
        row([
          column(5, [
            heading('What we do', 2),
            paragraph('A focused set of services you can restyle or replace after insert.'),
            button('Talk to us'),
          ]),
          column(7, [
            stack([
              n('service', { title: 'Brand websites', description: 'Structured marketing sites.', icon: 'globe' }),
              n('service', { title: 'Section systems', description: 'Reusable layouts that stay editable.', icon: 'layout' }),
            ]),
          ]),
        ]),
      ],
    ),

  'testimonials-quote': () =>
    section(
      'Testimonials',
      'testimonials-quote',
      [
        stack(
          [
            n('quote', {
              quote: 'The editor finally matches how we think about pages.',
              author: 'Amina Shaw',
              title: 'Founder',
            }),
          ],
          { flex: { alignItems: 'center' } },
        ),
      ],
    ),

  'testimonials-cards': () =>
    section(
      'Testimonials',
      'testimonials-cards',
      [
        heading('What clients say', 2),
        grid(2, [
          n('testimonial', {
            quote: 'The editor finally matches how we think about pages.',
            author: 'Amina Shaw',
            role: 'Founder',
            rating: 5,
          }),
          n('testimonial', {
            quote: 'We can change copy without breaking the layout.',
            author: 'Julian Hayes',
            role: 'Creative Director',
            rating: 5,
          }),
        ]),
      ],
    ),

  'testimonials-grid': () =>
    section(
      'Testimonials',
      'testimonials-grid',
      [
        heading('Kind words', 2),
        grid(3, [
          n('testimonial', { quote: 'Clean structure, calmer editing.', author: 'Leah Cho', role: 'Producer', rating: 5 }),
          n('testimonial', { quote: 'Publishing no longer feels risky.', author: 'Omar Reid', role: 'Director', rating: 5 }),
          n('testimonial', { quote: 'Our team actually uses the editor.', author: 'Priya Nair', role: 'Marketer', rating: 5 }),
        ]),
      ],
    ),

  'pricing-three-column': () =>
    section(
      'Pricing',
      'pricing-three-column',
      [
        heading('Pricing', 2),
        grid(3, [
          plan('Starter', '$49', 'For focused marketing sites.'),
          plan('Studio', '$99', 'For growing brands that need more pages.', true),
          plan('Partner', '$199', 'For teams that need launch support.'),
        ]),
      ],
    ),

  'pricing-highlighted-plan': () =>
    section(
      'Pricing',
      'pricing-highlighted-plan',
      [
        heading('Choose a plan', 2),
        grid(3, [
          plan('Launch', '$79', 'A refined one-site plan.'),
          n(
            'pricing',
            {
              planName: 'Studio',
              price: '$129',
              billingPeriod: 'per month',
              description: 'The highlighted plan for most teams.',
              features: ['Unlimited pages', 'Contact variants', 'Theme tokens', 'Revision history'],
              ctaLabel: 'Choose Studio',
              ctaHref: '#contact',
              isPopular: true,
            },
            [],
            {
              border: { width: '2px', color: 'primary' },
            },
          ),
          plan('Scale', '$249', 'For multi-page brands.'),
        ]),
      ],
    ),

  'pricing-comparison': () =>
    section(
      'Pricing',
      'pricing-comparison',
      [
        heading('Compare plans', 2),
        grid(3, [
          stack([heading('Starter', 3), n('list', { items: ['1 website', 'Core blocks', 'Contact form'], styleType: 'check' })]),
          stack([heading('Studio', 3), n('list', { items: ['Multiple pages', 'All section variants', 'Theme tokens'], styleType: 'check' })]),
          stack([heading('Partner', 3), n('list', { items: ['Launch support', 'Reusable sections', 'Priority review'], styleType: 'check' })]),
        ]),
      ],
    ),

  'gallery-grid': () =>
    section(
      'Gallery',
      'gallery-grid',
      [
        heading('Selected work', 2),
        grid(3, [
          image('Gallery image 1', IMG.work1),
          image('Gallery image 2', IMG.work2),
          image('Gallery image 3', IMG.work3),
        ]),
      ],
    ),

  'gallery-masonry': () =>
    section(
      'Gallery',
      'gallery-masonry',
      [
        heading('Selected work', 2),
        grid(
          3,
          [
            image('Gallery image 1', IMG.work1),
            image('Gallery image 2', IMG.work2),
            image('Gallery image 3', IMG.work3),
            image('Gallery image 4', IMG.work4),
            image('Gallery image 5', IMG.studio),
            image('Gallery image 6', IMG.interior),
          ],
          'masonry',
        ),
      ],
    ),

  'gallery-featured': () =>
    section(
      'Gallery',
      'gallery-featured',
      [
        heading('Featured work', 2),
        stack([
          image('Featured image', IMG.studio),
          grid(3, [image('Detail 1', IMG.work1), image('Detail 2', IMG.work2), image('Detail 3', IMG.work3)]),
        ]),
      ],
    ),

  'media-featured': () =>
    section(
      'Media',
      'media-featured',
      [heading('In the studio', 2), image('Studio still', IMG.interior), paragraph('Replace this image with your own media asset.')],
    ),

  'faq-accordion': () =>
    section(
      'FAQ',
      'faq-accordion',
      [
        heading('Frequently asked questions', 2),
        stack([
          n('stack', { collapsible: true, collapsed: false }, [
            heading('Can I edit on mobile?', 3),
            paragraph('Yes. Mobile styles inherit desktop unless you override them.'),
          ]),
          n('stack', { collapsible: true, collapsed: true }, [
            heading('Will my current site break?', 3),
            paragraph('Existing templates remain valid documents and upgrade safely.'),
          ]),
          n('stack', { collapsible: true, collapsed: true }, [
            heading('Are blocks locked after insert?', 3),
            paragraph('No. They become normal nodes you can edit, move, or delete.'),
          ]),
        ]),
      ],
    ),

  'faq-two-column': () =>
    section(
      'FAQ',
      'faq-two-column',
      [
        heading('Questions', 2),
        grid(2, [
          qa('Can I reuse layouts?', 'Yes. Insert a block, then restyle the resulting tree.'),
          qa('Do contact layouts share logic?', 'Yes. Visual variants wrap the same lead form.'),
          qa('Is CSS arbitrary?', 'No. Styles stay structured and validated.'),
          qa('Can AI edit later?', 'Future AI operations can reuse this same engine.'),
        ]),
      ],
    ),

  'cta-centered': () =>
    section(
      'CTA',
      'cta-centered',
      [
        stack(
          [
            heading('Ready to publish something you are proud of?', 2),
            paragraph('Start from a validated WebsiteDocument and ship with confidence.'),
            button('Start building'),
          ],
          { flex: { alignItems: 'center' }, typography: { textAlign: 'center' } },
        ),
      ],
      { background: { color: 'primary' }, typography: { color: '#FFFFFF' } },
    ),

  'cta-split': () =>
    section(
      'CTA',
      'cta-split',
      [
        row([
          column(7, [
            heading('Let’s build the next version of your site', 2),
            paragraph('Keep the document, change the layout.'),
          ]),
          column(5, [button('Start a project')]),
        ]),
      ],
    ),

  'cta-minimal': () =>
    section('CTA', 'cta-minimal', [stack([heading('Get in touch', 2), button('Contact', '#contact', 'secondary')])]),

  'footer-simple': () =>
    section(
      'Footer',
      'footer-simple',
      [stack([text('© 2026 KDBA. All rights reserved.'), link('Privacy', '/privacy')])],
      { spacing: { padding: { top: '32px', bottom: '32px' } } },
    ),

  'footer-multi-column': () =>
    section(
      'Footer',
      'footer-multi-column',
      [
        row([
          column(6, [heading('KDBA', 3), paragraph('Structured websites for ambitious brands.')]),
          column(3, [heading('Visit', 4), link('Privacy', '/privacy'), link('Contact', '#contact')]),
          column(3, [heading('Follow', 4), link('Instagram', 'https://instagram.com'), link('LinkedIn', 'https://linkedin.com')]),
        ]),
        divider(),
        text('© 2026 KDBA. All rights reserved.'),
      ],
    ),

  'footer-centered': () =>
    section(
      'Footer',
      'footer-centered',
      [
        stack(
          [heading('KDBA', 3), paragraph('Structured websites for ambitious brands.'), link('Contact', '#contact'), text('© 2026 KDBA.')],
          { flex: { alignItems: 'center' }, typography: { textAlign: 'center' } },
        ),
      ],
    ),

  'nav-simple': () =>
    section(
      'Navigation',
      'nav-simple',
      [
        row([
          column(4, [heading('Brand', 3)]),
          column(8, [stack([link('Home', '/'), link('Work', '/#gallery'), link('Contact', '#contact')], { flex: { direction: 'row', gap: '16px' } })]),
        ]),
      ],
      { spacing: { padding: { top: '16px', bottom: '16px' } } },
    ),

  'social-links': () =>
    section(
      'Social',
      'social-links',
      [
        stack(
          [
            heading('Follow along', 2),
            stack([link('Instagram', 'https://instagram.com'), link('LinkedIn', 'https://linkedin.com'), link('X', 'https://x.com')], {
              flex: { direction: 'row', gap: '16px' },
            }),
          ],
          { flex: { alignItems: 'center' } },
        ),
      ],
    ),

  'contact-simple': () =>
    section(
      'Contact',
      'contact-simple',
      [
        heading('Let’s talk', 2),
        paragraph('Tell us about the brand, the launch date, and what the site needs to do.'),
        leadForm('simple'),
      ],
      undefined,
      { anchorId: 'contact' },
    ),

  'contact-split': () =>
    section(
      'Contact',
      'contact-split',
      [
        row([
          column(5, [
            heading('Start a conversation', 2),
            paragraph('Share a few details and we will follow up with next steps.'),
            paragraph('We usually reply within two business days.'),
          ]),
          column(7, [leadForm('split')]),
        ]),
      ],
      undefined,
      { anchorId: 'contact' },
    ),

  'contact-image': () =>
    section(
      'Contact',
      'contact-image',
      [
        row([
          column(6, [image('Studio', IMG.interior)]),
          column(6, [heading('Visit or write', 2), paragraph('Send a note and we will get back to you.'), leadForm('image')]),
        ]),
      ],
      undefined,
      { anchorId: 'contact' },
    ),

  'contact-info': () =>
    section(
      'Contact',
      'contact-info',
      [
        heading('Contact', 2),
        row([
          column(5, [
            n('opening-hours', { title: 'Studio hours' }),
            n('map', { address: '100 Market St, San Francisco, CA', zoom: 14 }),
          ]),
          column(7, [leadForm('contact-info')]),
        ]),
      ],
      undefined,
      { anchorId: 'contact' },
    ),

  'contact-centered': () =>
    section(
      'Contact',
      'contact-centered',
      [
        stack(
          [
            heading('Get in touch', 2),
            paragraph('One focused form. Same lead handling as every other contact layout.'),
            leadForm('centered'),
          ],
          { flex: { alignItems: 'center' }, typography: { textAlign: 'center' } },
        ),
      ],
      undefined,
      { anchorId: 'contact' },
    ),

  'contact-business': () =>
    section(
      'Contact',
      'contact-business',
      [
        heading('Business inquiries', 2),
        row([
          column(4, [
            heading('Studio', 3),
            paragraph('100 Market St, San Francisco, CA'),
            n('opening-hours', { title: 'Hours' }),
            paragraph('hello@kdba.studio'),
          ]),
          column(8, [card([leadForm('business')], 'bordered')]),
        ]),
      ],
      undefined,
      { anchorId: 'contact' },
    ),

  'contact-minimal': () =>
    section('Contact', 'contact-minimal', [leadForm('minimal')], undefined, { anchorId: 'contact' }),

  'contact-full-width': () =>
    n(
      'section',
      { name: 'Contact', blockId: 'contact-full-width', fullWidth: true, anchorId: 'contact' },
      [n('container', { maxWidth: '100%' }, [heading('Contact us', 2), leadForm('full-width')])],
    ),
};
