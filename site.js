const appDownloadUrl = 'https://order-up.chottu.link/hotdownload';

const audienceContent = {
  drinkers: {
    title: 'Coffee that moves with your day.',
    lede: 'Order ahead at participating coffee shops, order with friends, pay with Apple Pay or Samsung Pay, and earn Bean Bucks on the coffees you already love.',
    ctaLabel: 'Download the app',
    ctaNavLabel: 'Download app',
    ctaHref: appDownloadUrl,
    userType: 'coffee_lover',
    flowNav: 'Coffee drinker flow'
  },
  corporate: {
    title: 'Your workplace coffee shop, available from every desk.',
    lede: 'Let employees order ahead from their desks, issue digital coffee vouchers, reduce rush-time queues, and keep your private café accessible only to approved staff.',
    ctaLabel: 'Book a demo',
    ctaNavLabel: 'Book a demo',
    ctaHref: '#get-in-touch',
    subject: 'Workplace coffee shop requested an OrderUp demo',
    message: 'A workplace coffee shop requested an OrderUp demo.',
    userType: 'workplace_coffee_shop',
    formEyebrow: 'For private workplace coffee shops',
    formTitle: 'Book an OrderUp! demo for your workplace coffee shop.',
    waitlistCopy: 'Tell us about your workplace café, and we will show you how desk ordering, employee-only access, and coffee vouchers can work for your team.',
    formSubmit: 'Book a demo',
    flowNav: 'Workplace coffee shop flow',
    waitlistPoints: [
      'See how employees order from their desks and collect when ready.',
      'Explore employee-only access and digital staff vouchers.',
      'Plan onboarding for one workplace coffee shop or several stores.'
    ],
    businessLabel: 'Business name',
    businessPlaceholder: 'Company or workplace name',
    locationLabel: 'Workplace location',
    locationPlaceholder: 'Office, campus, or building',
    setupLabel: 'Number of coffee shops',
    setupOptions: ['Choose one', '1 coffee shop', '2-3 coffee shops', '4-10 coffee shops', '11+ coffee shops', 'Planning our first coffee shop'],
    notePlaceholder: 'Tell us about your workplace, number of coffee shops, employee access, or demo goals.'
  },
  shops: {
    title: 'A faster lane for your coffee shop.',
    lede: 'Take paid mobile orders, manage prep, control availability, track performance, and give your regulars built-in rewards.',
    ctaLabel: 'Book a demo',
    ctaNavLabel: 'Book a demo',
    ctaHref: '#get-in-touch',
    subject: 'Coffee shop requested an OrderUp demo',
    message: 'A coffee shop requested an OrderUp demo.',
    userType: 'coffee_shop',
    formEyebrow: 'For coffee shops and operators',
    formTitle: 'Book an OrderUp! demo for your coffee shop.',
    waitlistCopy: 'Tell us about your shop and we will show you how OrderUp! can support ordering, rewards, and pickup.',
    formSubmit: 'Book a demo',
    flowNav: 'Coffee shop flow',
    waitlistPoints: [
      'See the merchant dashboard, live order flow, and availability controls.',
      'Talk through your menu setup, onboarding, and launch.',
      'Ask about payouts, loyalty, reporting, and day-to-day operations.'
    ],
    businessLabel: 'Business name',
    businessPlaceholder: 'Coffee shop name',
    locationLabel: 'Location',
    locationPlaceholder: 'City or neighbourhood',
    setupLabel: 'Current setup',
    setupOptions: ['Choose one', 'Single coffee shop', '2-5 coffee shops', '6+ coffee shops', 'Franchise or group operator', 'Pop-up or mobile bar', 'Opening soon'],
    notePlaceholder: 'Tell us about your ordering setup or demo goals.'
  }
}

const navToggle = document.querySelector('.nav-toggle')
const navLinks = document.querySelector('.nav-links')
const audienceTabs = document.querySelectorAll('[data-audience]')
const heroEyebrow = document.querySelector('#audience-eyebrow')
const heroTitle = document.querySelector('#hero-title')
const heroLede = document.querySelector('#hero-lede')
const navFlow = document.querySelector('#nav-flow')
const waitlistEyebrow = document.querySelector('#waitlist-eyebrow')
const waitlistCopy = document.querySelector('#waitlist-copy')
const waitlistTitle = document.querySelector('#waitlist-title')
const waitlistPoints = document.querySelectorAll('#waitlist-points li')
const waitlistForm = document.querySelector('#waitlist-form')
const formStatus = waitlistForm?.querySelector('#form-status')
const supportForm = document.querySelector('#support-form')
const supportFormStatus = supportForm?.querySelector('#support-form-status')
const accountDeletionForm = document.querySelector('#account-deletion-form')
const accountDeletionFormStatus = accountDeletionForm?.querySelector('#account-deletion-form-status')
const shopFields = document.querySelector('#shop-fields')
const phoneField = document.querySelector('#phone-field')
const phoneInput = phoneField?.querySelector('input')
const emailSubject = document.querySelector('#email-subject')
const emailMessage = document.querySelector('#email-message')
const userType = document.querySelector('#user-type')
const signupRadios = document.querySelectorAll('input[name="signup_type"]')
const submitText = waitlistForm?.querySelector('.submit-text')
const flowSections = document.querySelectorAll('[data-flow]')
const getInTouchSection = document.querySelector('#get-in-touch')
const primaryCtas = document.querySelectorAll('[data-primary-cta]')
const bookingPicker = document.querySelector('#booking-picker')
const bookingDatesContainer = document.querySelector('#booking-dates')
const bookingSlotsContainer = document.querySelector('#booking-slots')
const bookingSelection = document.querySelector('#booking-selection')
const meetingDateInput = document.querySelector('#meeting-date')
const meetingTimeInput = document.querySelector('#meeting-time')
const businessNameLabel = document.querySelector('#business-name-label')
const businessNameInput = document.querySelector('#business-name-input')
const shopLocationLabel = document.querySelector('#shop-location-label')
const shopLocationInput = document.querySelector('#shop-location-input')
const shopSetupLabel = document.querySelector('#shop-setup-label')
const shopSetupSelect = document.querySelector('#shop-setup-select')
const demoNote = document.querySelector('#demo-note')

const meetingTimeZone = 'Africa/Johannesburg';
const meetingDisplayHours = [10, 11, 12, 13, 14, 15, 16]
const meetingAvailableWeekdays = new Set([0, 1, 2, 3, 4])
const meetingLaterAvailability = [
  [10, 12, 14],
  [11, 13, 15],
  [10, 11, 14, 16],
  [10, 12, 15]
]

let meetingDates = []
let selectedMeetingDate = '';

let currentAudience = 'drinkers';

function getSouthAfricaCalendarDate (now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-ZA', {
    timeZone: meetingTimeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    12
  ))
}

function formatMeetingDateKey (date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMeetingHoursForDateIndex (dateIndex) {
  if (dateIndex < 2) {
    return [10, 11]
  }

  return meetingLaterAvailability[(dateIndex - 2) % meetingLaterAvailability.length]
}

function createMeetingDateDetails (date, availableHours, isLeadDay = false) {
  const weekdayNumber = date.getUTCDay()
  const isFriday = weekdayNumber === 5
  const isSaturday = weekdayNumber === 6

  return {
    key: formatMeetingDateKey(date),
    weekday: new Intl.DateTimeFormat('en-ZA', {
      weekday: 'short',
      timeZone: 'UTC'
    }).format(date),
    day: new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date),
    month: new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      timeZone: 'UTC'
    }).format(date),
    longLabel: new Intl.DateTimeFormat('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date),
    isFriday,
    isSaturday,
    isFullyBooked: isLeadDay || isFriday,
    availableHours
  }
}

function getBookableMeetingDates (now = new Date(), requestedDateCount = 8) {
  const cursor = getSouthAfricaCalendarDate(now)
  const dates = []
  let availableDateIndex = 0

  for (let dayOffset = 0; dayOffset < requestedDateCount; dayOffset += 1) {
    const weekday = cursor.getUTCDay()
    const isLeadDay = dayOffset < 2
    let availableHours = []

    if (!isLeadDay && meetingAvailableWeekdays.has(weekday)) {
      availableHours = getMeetingHoursForDateIndex(availableDateIndex)
      availableDateIndex += 1
    }

    dates.push(createMeetingDateDetails(cursor, availableHours, isLeadDay))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

function clearMeetingSelection () {
  if (meetingDateInput) {
    meetingDateInput.value = '';
  }
  if (meetingTimeInput) {
    meetingTimeInput.value = '';
  }
  if (bookingSelection) {
    bookingSelection.classList.remove('has-selection')
    bookingSelection.querySelector('span:last-child').textContent = 'Choose a time to reserve your demo.';
  }
}

function renderMeetingSlots () {
  if (!bookingSlotsContainer) {
    return
  }

  const date = meetingDates.find((item) => item.key === selectedMeetingDate)
  clearMeetingSelection()

  if (!date) {
    bookingSlotsContainer.innerHTML = '';
    return
  }

  bookingSlotsContainer.innerHTML = meetingDisplayHours.map((hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`
    const isAvailable = date.availableHours.includes(hour)

    if (!isAvailable) {
      return `
        <button class="booking-slot is-booked" type="button" disabled aria-label="${time}, booked">
          <strong>${time}</strong>
          <small>Booked</small>
        </button>
      `
    }

    const inputId = `meeting-${date.key}-${hour}`
    const value = `${date.key}T${time}:00+02:00`

    return `
      <label class="booking-slot is-available" for="${inputId}">
        <input type="radio" name="meeting_slot" id="${inputId}" value="${value}" required
          data-meeting-date="${date.key}" data-meeting-time="${time}">
        <span>
          <strong>${time}</strong>
          <small>Available</small>
        </span>
      </label>
    `
  }).join('')

  if (!date.availableHours.length && bookingSelection) {
    bookingSelection.querySelector('span:last-child').textContent = date.isFriday
      ? 'Friday is fully booked. Choose another date.'
      : date.isFullyBooked
        ? 'This date is fully booked. Choose another date.'
        : 'No times are available on this date.';
  }
}

function renderMeetingPicker (now = new Date(), options = {}) {
  if (!bookingPicker || !bookingDatesContainer) {
    return
  }

  meetingDates = getBookableMeetingDates(now)
  const selectedDateStillExists = meetingDates.some((date) => date.key === selectedMeetingDate)

  if (options.resetSelection || !selectedDateStillExists) {
    selectedMeetingDate = meetingDates.find((date) => date.availableHours.length)?.key || meetingDates[0]?.key || '';
  }

  bookingDatesContainer.innerHTML = meetingDates.map((date) => {
    const isSelected = date.key === selectedMeetingDate
    const stateClass = date.isSaturday
      ? ' is-saturday'
      : date.isFullyBooked
        ? ` is-fully-booked${date.isFriday ? ' is-friday' : ''}`
        : '';
    const stateLabel = date.isSaturday ? ', unavailable' : date.isFullyBooked ? ', fully booked' : '';

    return `
      <button class="booking-date${stateClass}${isSelected ? ' is-selected' : ''}" type="button"
        data-meeting-date="${date.key}" aria-pressed="${String(isSelected)}"
        aria-label="${date.longLabel}${stateLabel}"${date.isSaturday ? ' disabled' : ''}>
        <span>${date.weekday}</span>
        <strong>${date.day}</strong>
        <small>${date.isSaturday ? date.month : date.isFullyBooked ? 'Booked' : date.month}</small>
      </button>
    `
  }).join('')

  renderMeetingSlots()
}

function setAudience (audience) {
  const content = audienceContent[audience] || audienceContent.drinkers
  currentAudience = audienceContent[audience] ? audience : 'drinkers';
  document.body.dataset.audience = currentAudience

  if (heroEyebrow) {
    heroEyebrow.textContent = content.eyebrow
  }
  if (heroTitle) {
    heroTitle.textContent = content.title
  }
  if (heroLede) {
    heroLede.textContent = content.lede
  }
  if (navFlow) {
    navFlow.textContent = content.flowNav
  }
  if (waitlistEyebrow) {
    waitlistEyebrow.textContent = content.formEyebrow || '';
  }
  if (waitlistTitle) {
    waitlistTitle.textContent = content.formTitle || '';
  }
  if (waitlistCopy) {
    waitlistCopy.textContent = content.waitlistCopy || '';
  }
  if (emailSubject) {
    emailSubject.value = content.subject || '';
  }
  if (emailMessage) {
    emailMessage.value = content.message || '';
  }
  if (userType) {
    userType.value = content.userType
  }
  if (submitText) {
    submitText.textContent = content.formSubmit || '';
  }
  if (businessNameLabel) {
    businessNameLabel.textContent = content.businessLabel || 'Business name';
  }
  if (businessNameInput) {
    businessNameInput.placeholder = content.businessPlaceholder || '';
  }
  if (shopLocationLabel) {
    shopLocationLabel.textContent = content.locationLabel || 'Location';
  }
  if (shopLocationInput) {
    shopLocationInput.placeholder = content.locationPlaceholder || '';
  }
  if (shopSetupLabel) {
    shopSetupLabel.textContent = content.setupLabel || 'Current setup';
  }
  if (shopSetupSelect && content.setupOptions) {
    shopSetupSelect.replaceChildren(...content.setupOptions.map((label, index) => {
      const option = document.createElement('option')
      option.value = index === 0 ? '' : label
      option.textContent = label
      return option
    }))
  }
  if (demoNote) {
    demoNote.placeholder = content.notePlaceholder || '';
  }
  if (getInTouchSection) {
    getInTouchSection.hidden = !['corporate', 'shops'].includes(currentAudience)
  }

  waitlistPoints.forEach((point, index) => {
    const text = content.waitlistPoints?.[index] || '';
    point.textContent = text
    point.hidden = !text
  })

  flowSections.forEach((section) => {
    const audiences = section.dataset.flow.split(/\s+/)
    section.hidden = !audiences.includes(currentAudience)
  })

  audienceTabs.forEach((tab) => {
    const isActive = tab.dataset.audience === currentAudience
    tab.classList.toggle('active', isActive)
    tab.setAttribute('aria-selected', String(isActive))
  })

  signupRadios.forEach((radio) => {
    radio.checked = radio.value === content.userType
  })

  primaryCtas.forEach((cta) => {
    cta.textContent = cta.classList.contains('nav-cta') ? content.ctaNavLabel : content.ctaLabel
    cta.setAttribute('href', content.ctaHref)
  })

  const isShop = ['corporate', 'shops'].includes(currentAudience)
  if (shopFields) {
    shopFields.hidden = !isShop
  }
  if (phoneField && phoneInput) {
    phoneField.hidden = !isShop
    phoneInput.disabled = !isShop
    phoneInput.required = isShop
    if (!isShop) {
      phoneInput.value = '';
    }
  }
}

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open')
  navToggle.setAttribute('aria-expanded', String(isOpen))
  document.body.classList.toggle('nav-open', isOpen)
})

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open')
    navToggle?.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('nav-open')
  })
})

audienceTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setAudience(tab.dataset.audience);
    [0, 80].forEach((delay) => {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }, delay)
    })
  })
})

signupRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    setAudience(radio.value === 'coffee_shop' ? 'shops' : 'drinkers')
  })
})

bookingDatesContainer?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-meeting-date]')

  if (!button || button.tagName !== 'BUTTON') {
    return
  }

  selectedMeetingDate = button.dataset.meetingDate

  bookingDatesContainer.querySelectorAll('[data-meeting-date]').forEach((dateButton) => {
    const isSelected = dateButton === button
    dateButton.classList.toggle('is-selected', isSelected)
    dateButton.setAttribute('aria-pressed', String(isSelected))
  })

  bookingPicker?.classList.remove('has-error')
  renderMeetingSlots()
})

bookingSlotsContainer?.addEventListener('change', (event) => {
  const input = event.target.closest('input[name="meeting_slot"]')

  if (!input) {
    return
  }

  const date = meetingDates.find((item) => item.key === input.dataset.meetingDate)
  const time = input.dataset.meetingTime

  if (meetingDateInput) {
    meetingDateInput.value = input.dataset.meetingDate
  }
  if (meetingTimeInput) {
    meetingTimeInput.value = time
  }
  if (bookingSelection && date) {
    bookingSelection.classList.add('has-selection')
    bookingSelection.querySelector('span:last-child').textContent =
      `${date.longLabel} at ${time} SAST`
  }

  bookingPicker?.classList.remove('has-error')
  formStatus.textContent = '';
  formStatus.className = 'form-status';
})

waitlistForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  formStatus.textContent = '';
  formStatus.className = 'form-status';

  const selectedSlot = waitlistForm.querySelector('input[name="meeting_slot"]:checked')

  if (!selectedSlot) {
    bookingPicker?.classList.add('has-error')
    formStatus.textContent = 'Choose an available meeting time before booking your demo.';
    formStatus.classList.add('error')
    bookingPicker?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return;
  }

  if (!waitlistForm.reportValidity()) {
    return
  }

  waitlistForm.classList.add('is-submitting')
  const submitButton = waitlistForm.querySelector("button[type='submit']")
  submitButton.disabled = true

  const formData = new FormData(waitlistForm)
  formData.set('audience', currentAudience)
  formData.set('submitted_at', new Date().toISOString())

  try {
    const response = await fetch(waitlistForm.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Submission failed')
    }

    try {
      const backup = Object.fromEntries(formData.entries())
      localStorage.setItem('orderup_demo_last_submission', JSON.stringify(backup))
    } catch (storageError) {
      // Storage is only a local convenience; the remote signup already succeeded.
    }
    waitlistForm.reset()
    renderMeetingPicker(new Date(), { resetSelection: true })
    setAudience(currentAudience)
    formStatus.textContent = 'Thank you. We have your demo request and will be in touch.';
    formStatus.classList.add('success')
  } catch (error) {
    formStatus.textContent = 'Something went wrong. Please try again in a moment.';
    formStatus.classList.add('error')
  } finally {
    waitlistForm.classList.remove('is-submitting')
    submitButton.disabled = false
  }
})

supportForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  supportFormStatus.textContent = '';
  supportFormStatus.className = 'form-status';

  if (!supportForm.reportValidity()) {
    return
  }

  supportForm.classList.add('is-submitting')
  const submitButton = supportForm.querySelector("button[type='submit']")
  submitButton.disabled = true

  const formData = new FormData(supportForm)
  formData.set('submitted_at', new Date().toISOString())

  try {
    const response = await fetch(supportForm.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Support submission failed')
    }

    supportForm.reset()
    supportFormStatus.textContent = 'Thank you. Your support request has been sent.';
    supportFormStatus.classList.add('success')
  } catch (error) {
    supportFormStatus.textContent = 'Something went wrong. Please email team@order-up.co.za or try again in a moment.';
    supportFormStatus.classList.add('error')
  } finally {
    supportForm.classList.remove('is-submitting')
    submitButton.disabled = false
  }
})

accountDeletionForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  accountDeletionFormStatus.textContent = '';
  accountDeletionFormStatus.className = 'form-status';

  if (!accountDeletionForm.reportValidity()) {
    return
  }

  accountDeletionForm.classList.add('is-submitting')
  const submitButton = accountDeletionForm.querySelector("button[type='submit']")
  submitButton.disabled = true

  const formData = new FormData(accountDeletionForm)
  formData.set('submitted_at', new Date().toISOString())

  try {
    const response = await fetch(accountDeletionForm.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Account deletion submission failed')
    }

    accountDeletionForm.reset()
    accountDeletionFormStatus.textContent = "It's been submitted. The OrderUp team will review your request and contact you soon."
    accountDeletionFormStatus.classList.add('success')
  } catch (error) {
    accountDeletionFormStatus.textContent = 'Something went wrong. Please email team@order-up.co.za or try again in a moment.';
    accountDeletionFormStatus.classList.add('error')
  } finally {
    accountDeletionForm.classList.remove('is-submitting')
    submitButton.disabled = false
  }
})

renderMeetingPicker()
setAudience(currentAudience)
