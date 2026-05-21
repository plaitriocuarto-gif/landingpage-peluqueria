document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navbar = document.querySelector('.navbar');
  
  if (mobileToggle && navbar) {
    mobileToggle.addEventListener('click', () => {
      navbar.classList.toggle('menu-open');
    });

    // Close menu when clicking on navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navbar.classList.remove('menu-open');
      });
    });
  }

  // FAQ Accordion Toggle Behavior
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');
      
      // Close all other accordion items
      document.querySelectorAll('.faq-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-answer').style.maxHeight = null;
        }
      });
      
      // Toggle the clicked accordion item
      if (isActive) {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Micro-interaction for the Hero Phone Mockup
  // Cycles the "active appointment" highlights automatically to represent a live turnero interface
  const apptItems = document.querySelectorAll('.appointment-item');
  let currentActiveIndex = 1; // 'Sofía Rodríguez' is active by default (index 1)

  if (apptItems.length > 0) {
    setInterval(() => {
      // Remove active highlights
      apptItems.forEach(item => {
        item.classList.remove('active-appt');
        const badge = item.querySelector('.status-badge');
        
        // Reset to default class/text based on position
        if (item === apptItems[0]) {
          badge.className = 'status-badge status-done';
          badge.textContent = 'Confirmado';
        } else {
          badge.className = 'status-badge status-pending';
          badge.textContent = 'Próximo';
        }
      });

      // Move to next appointment index
      currentActiveIndex = (currentActiveIndex + 1) % apptItems.length;
      
      // Set new active item
      const activeAppt = apptItems[currentActiveIndex];
      activeAppt.classList.add('active-appt');
      
      const badge = activeAppt.querySelector('.status-badge');
      badge.className = 'status-badge status-current';
      badge.textContent = 'En corte';
    }, 4500);
  }

  // Smooth scroll adjust for anchor links with navbar offset
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});
