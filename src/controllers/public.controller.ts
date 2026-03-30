import { Request, Response, NextFunction } from 'express';

/**
 * Public Pages Controller
 * Handles static pages like contact, about, faq, careers
 */
export const getContact = (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactInfo = {
      email: 'support@fashionshop.com',
      phone: '0901234567',
      address: {
        street: '123 Fashion Street',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        country: 'Vietnam'
      },
      workingHours: 'Mon - Sun: 9:00 - 21:00',
      socialMedia: {
        facebook: 'https://facebook.com/fashionshop',
        instagram: 'https://instagram.com/fashionshop',
        tiktok: 'https://tiktok.com/@fashionshop'
      }
    };

    res.json({
      success: true,
      data: contactInfo
    });
  } catch (error) {
    next(error);
  }
};

export const getAbout = (req: Request, res: Response, next: NextFunction) => {
  try {
    const aboutInfo = {
      description: 'Fashion Shop is a modern e-commerce platform offering the latest fashion trends. We are dedicated to providing high-quality products and exceptional customer service.',
      mission: 'To make fashion accessible to everyone by offering trendy, affordable, and sustainably made clothing.',
      vision: 'To become the leading fashion e-commerce platform in Southeast Asia, known for quality, service, and innovation.',
      values: [
        'Quality First',
        'Customer Obsession',
        'Sustainability',
        'Innovation',
        'Integrity'
      ],
      foundedYear: 2025,
      teamSize: '50+'
    };

    res.json({
      success: true,
      data: aboutInfo
    });
  } catch (error) {
    next(error);
  }
};

export const getFAQ = (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = [
      {
        id: 1,
        question: 'How do I place an order?',
        answer: 'Browse our products, add items to your cart, and proceed to checkout. You can checkout as a guest or create an account.'
      },
      {
        id: 2,
        question: 'What payment methods do you accept?',
        answer: 'We accept Cash on Delivery (COD), Momo, and VNPay for your convenience.'
      },
      {
        id: 3,
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.'
      },
      {
        id: 4,
        question: 'Can I return or exchange items?',
        answer: 'Yes, we offer a 7-day return policy for unused items in original packaging. Please contact our support team.'
      },
      {
        id: 5,
        question: 'How do I track my order?',
        answer: 'Once your order is shipped, you will receive a tracking number via email to track your package.'
      },
      {
        id: 6,
        question: 'Do you ship internationally?',
        answer: 'Currently we only ship within Vietnam. International shipping will be available soon.'
      }
    ];

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

export const getCareers = (req: Request, res: Response, next: NextFunction) => {
  try {
    const careers = {
      openPositions: [
        {
          id: 1,
          title: 'Frontend Developer',
          department: 'Engineering',
          location: 'Ho Chi Minh City (Remote/Hybrid)',
          type: 'Full-time',
          description: 'We are looking for a skilled Frontend Developer with experience in React and Next.js to join our team.',
          requirements: [
            '3+ years of React/Next.js experience',
            'Strong TypeScript skills',
            'Experience with Tailwind CSS',
            'Good communication skills'
          ]
        },
        {
          id: 2,
          title: 'Backend Developer',
          department: 'Engineering',
          location: 'Ho Chi Minh City (Remote/Hybrid)',
          type: 'Full-time',
          description: 'Join our backend team to build and scale our Node.js/Express APIs.',
          requirements: [
            '3+ years of Node.js/Express experience',
            'Strong SQL database skills',
            'Experience with REST APIs and authentication',
            'Knowledge of cloud platforms (AWS, Railway)'
          ]
        },
        {
          id: 3,
          title: 'UI/UX Designer',
          department: 'Design',
          location: 'Ho Chi Minh City (Remote/Hybrid)',
          type: 'Full-time',
          description: 'We need a creative UI/UX designer to craft beautiful and intuitive user experiences.',
          requirements: [
            'Portfolio showcasing web and mobile designs',
            'Proficiency in Figma or similar tools',
            'Understanding of user research and testing',
            'Collaboration skills with developers'
          ]
        }
      ],
      benefits: [
        'Competitive salary',
        'Flexible working hours',
        'Remote work options',
        'Health insurance',
        'Learning budget',
        'Team building activities'
      ]
    };

    res.json({
      success: true,
      data: careers
    });
  } catch (error) {
    next(error);
  }
};
