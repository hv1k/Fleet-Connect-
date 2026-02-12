/**
 * FleetConnect Internationalization (i18n) Utility
 * Manages multi-language support across all pages
 *
 * Usage:
 *   <script src="i18n.js"></script>
 *   FC_i18n.init('en');
 *   FC_i18n.t('nav.dashboard')  // Returns translated string
 *   FC_i18n.setLang('es');       // Switch to Spanish
 *   <span data-i18n="common.save">Save</span>  // Will be auto-translated
 */

window.FC_i18n = {
    currentLang: 'en',
    translations: {
        en: {
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.jobs': 'Jobs',
            'nav.workOrders': 'Work Orders',
            'nav.invoices': 'Invoices',
            'nav.documents': 'Documents',
            'nav.settings': 'Settings',
            'nav.dailyLog': 'Daily Log',
            'nav.createJob': 'Create Work Order',
            'nav.createOrder': 'Create Work Order',
            'nav.users': 'User Management',
            'nav.reports': 'Reports',
            'nav.admin': 'Admin Panel',

            // Common
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.close': 'Close',
            'common.search': 'Search...',
            'common.loading': 'Loading...',
            'common.noData': 'No data available',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.confirm': 'Confirm',
            'common.back': 'Back',
            'common.next': 'Next',
            'common.previous': 'Previous',
            'common.skip': 'Skip',
            'common.submit': 'Submit',
            'common.download': 'Download',
            'common.upload': 'Upload',
            'common.preview': 'Preview',
            'common.details': 'Details',
            'common.actions': 'Actions',
            'common.filter': 'Filter',
            'common.sort': 'Sort',
            'common.export': 'Export',
            'common.import': 'Import',
            'common.add': 'Add',
            'common.remove': 'Remove',
            'common.select': 'Select',
            'common.view': 'View',
            'common.manage': 'Manage',
            'common.status': 'Status',
            'common.date': 'Date',
            'common.time': 'Time',
            'common.name': 'Name',
            'common.email': 'Email',
            'common.phone': 'Phone',
            'common.address': 'Address',
            'common.notes': 'Notes',

            // Jobs/Work Orders
            'jobs.active': 'Active Jobs',
            'jobs.pending': 'Pending',
            'jobs.completed': 'Completed',
            'jobs.create': 'Create Job',
            'jobs.createOrder': 'Create Work Order',
            'jobs.assign': 'Assign Worker',
            'jobs.accept': 'Accept Job',
            'jobs.decline': 'Decline Job',
            'jobs.jobSite': 'Job Site',
            'jobs.contractNumber': 'Contract #',
            'jobs.location': 'Location',
            'jobs.status': 'Status',
            'jobs.dateOut': 'Date Out',
            'jobs.dateReturn': 'Est. Return',
            'jobs.vendor': 'Vendor',
            'jobs.worker': 'Worker',
            'jobs.equipment': 'Equipment',
            'jobs.instructions': 'Instructions',
            'jobs.details': 'Job Details',
            'jobs.history': 'Job History',
            'jobs.fullHistory': 'Full History',

            // Invoices
            'invoices.create': 'Create Invoice',
            'invoices.total': 'Total Amount',
            'invoices.submit': 'Submit Invoice',
            'invoices.submitted': 'Submitted',
            'invoices.pending': 'Pending',
            'invoices.approved': 'Approved',
            'invoices.rejected': 'Rejected',
            'invoices.gallons': 'Gallons',
            'invoices.diesel': 'Diesel',
            'invoices.def': 'DEF',
            'invoices.fuelDelivered': 'Fuel Delivered',
            'invoices.unitNumber': 'Unit #',
            'invoices.deliveredBy': 'Delivered By',
            'invoices.deliveryDate': 'Delivery Date',
            'invoices.totalDelivered': 'Total Delivered',
            'invoices.history': 'Invoice History',
            'invoices.quickbooksId': 'QuickBooks ID',

            // Documents
            'docs.storage': 'Document Storage',
            'docs.upload': 'Upload Document',
            'docs.category': 'Category',
            'docs.contracts': 'Contracts',
            'docs.permits': 'Permits',
            'docs.safetyCerts': 'Safety Certificates',
            'docs.equipmentManuals': 'Equipment Manuals',
            'docs.other': 'Other',
            'docs.relatedJob': 'Related Job #',
            'docs.relatedEquipment': 'Related Equipment #',
            'docs.tags': 'Tags',
            'docs.uploadedBy': 'Uploaded By',
            'docs.totalDocuments': 'Total Documents',
            'docs.thisMonth': 'This Month',
            'docs.storageUsed': 'Storage Used',
            'docs.dragDrop': 'Drag files here or click to browse',
            'docs.maxSize': 'Max 10MB per file',
            'docs.download': 'Download',
            'docs.preview': 'Preview',
            'docs.delete': 'Delete',
            'docs.share': 'Share',
            'docs.noDocuments': 'No documents found',

            // Field Worker specific
            'fw.navigate': 'Navigate',
            'fw.clockIn': 'Clock In',
            'fw.clockOut': 'Clock Out',
            'fw.signature': 'Capture Signature',
            'fw.photos': 'Take Photos',
            'fw.checklist': 'Service Checklist',
            'fw.offline': 'You are offline',
            'fw.syncing': 'Syncing...',
            'fw.mobileApp': 'Mobile App',
            'fw.myJobs': 'My Jobs',
            'fw.jobDetails': 'Job Details',
            'fw.completeJob': 'Complete Job',
            'fw.startJob': 'Start Job',
            'fw.incidentReport': 'Incident Report',
            'fw.reportIncident': 'Report Incident',
            'fw.gpsLocation': 'GPS Location',
            'fw.attachPhotos': 'Attach Photos',
            'fw.serviceNotes': 'Service Notes',

            // Status
            'status.online': 'Online',
            'status.offline': 'Offline',
            'status.pending': 'Pending',
            'status.active': 'Active',
            'status.completed': 'Completed',
            'status.accepted': 'Accepted',
            'status.declined': 'Declined',
            'status.inProgress': 'In Progress',
            'status.onHold': 'On Hold',
            'status.cancelled': 'Cancelled',
            'status.available': 'Available',
            'status.assigned': 'Assigned',

            // Settings
            'settings.account': 'Account',
            'settings.language': 'Language',
            'settings.english': 'English',
            'settings.spanish': 'Español',
            'settings.darkMode': 'Dark Mode',
            'settings.notifications': 'Notifications',
            'settings.preferences': 'Preferences',
            'settings.security': 'Security',
            'settings.password': 'Password',
            'settings.logout': 'Logout',
            'settings.profile': 'Profile',
            'settings.company': 'Company',
            'settings.timezone': 'Timezone',
            'settings.units': 'Units (Gallons/Liters)',

            // Admin
            'admin.users': 'User Management',
            'admin.companies': 'Companies',
            'admin.roles': 'Roles',
            'admin.features': 'Feature Flags',
            'admin.reports': 'Reports',
            'admin.analytics': 'Analytics',
            'admin.systemSettings': 'System Settings',
            'admin.allOrders': 'All Orders',
            'admin.allInvoices': 'All Invoices',
            'admin.allDocuments': 'All Documents',
            'admin.monitoring': 'Monitoring',

            // Vendor Dashboard
            'vendor.activeJobs': 'Active Jobs',
            'vendor.totalDiesel': 'Total Diesel',
            'vendor.totalDEF': 'Total DEF',
            'vendor.pendingWorkers': 'Pending Workers',
            'vendor.recentActivity': 'Recent Activity',
            'vendor.jobsbyStatus': 'Jobs by Status',
            'vendor.fuelDelivered': 'Fuel Delivered',
            'vendor.dashboard': 'Vendor Dashboard',

            // Rental Dashboard
            'rental.activeOrders': 'Active Orders',
            'rental.totalGallons': 'Total Gallons',
            'rental.myWorkOrders': 'My Work Orders',
            'rental.ordersThisWeek': 'Orders This Week',
            'rental.ordersByStatus': 'Orders by Status',
            'rental.dashboard': 'Rental Dashboard',

            // Messages & Alerts
            'msg.welcomeBack': 'Welcome back',
            'msg.goodMorning': 'Good morning',
            'msg.goodAfternoon': 'Good afternoon',
            'msg.goodEvening': 'Good evening',
            'msg.saved': 'Saved successfully',
            'msg.deleted': 'Deleted successfully',
            'msg.updated': 'Updated successfully',
            'msg.uploaded': 'Uploaded successfully',
            'msg.confirmedDelete': 'Are you sure you want to delete this?',
            'msg.confirmLogout': 'Are you sure you want to logout?',
            'msg.networkError': 'Network error. Please try again.',
            'msg.sessionExpired': 'Your session has expired. Please login again.',
            'msg.unauthorized': 'You do not have permission to access this resource.',

            // Analytics & Reports
            'report.title': 'Report',
            'report.daily': 'Daily',
            'report.weekly': 'Weekly',
            'report.monthly': 'Monthly',
            'report.custom': 'Custom',
            'report.exportAs': 'Export As',
            'report.pdf': 'PDF',
            'report.csv': 'CSV',
            'report.excel': 'Excel',

            // Validation
            'validate.required': 'This field is required',
            'validate.email': 'Please enter a valid email',
            'validate.phone': 'Please enter a valid phone number',
            'validate.zipCode': 'Please enter a valid zip code',
            'validate.minimumLength': 'Minimum length is {min} characters',
            'validate.maximumLength': 'Maximum length is {max} characters',
            'validate.matchPassword': 'Passwords do not match',
        },
        es: {
            // Navigation
            'nav.dashboard': 'Panel de Control',
            'nav.jobs': 'Trabajos',
            'nav.workOrders': 'Órdenes de Trabajo',
            'nav.invoices': 'Facturas',
            'nav.documents': 'Documentos',
            'nav.settings': 'Configuración',
            'nav.dailyLog': 'Registro Diario',
            'nav.createJob': 'Crear Orden de Trabajo',
            'nav.createOrder': 'Crear Orden de Trabajo',
            'nav.users': 'Gestión de Usuarios',
            'nav.reports': 'Reportes',
            'nav.admin': 'Panel de Administrador',

            // Common
            'common.save': 'Guardar',
            'common.cancel': 'Cancelar',
            'common.delete': 'Eliminar',
            'common.edit': 'Editar',
            'common.close': 'Cerrar',
            'common.search': 'Buscar...',
            'common.loading': 'Cargando...',
            'common.noData': 'Sin datos disponibles',
            'common.error': 'Error',
            'common.success': 'Éxito',
            'common.confirm': 'Confirmar',
            'common.back': 'Atrás',
            'common.next': 'Siguiente',
            'common.previous': 'Anterior',
            'common.skip': 'Omitir',
            'common.submit': 'Enviar',
            'common.download': 'Descargar',
            'common.upload': 'Cargar',
            'common.preview': 'Vista Previa',
            'common.details': 'Detalles',
            'common.actions': 'Acciones',
            'common.filter': 'Filtrar',
            'common.sort': 'Ordenar',
            'common.export': 'Exportar',
            'common.import': 'Importar',
            'common.add': 'Añadir',
            'common.remove': 'Quitar',
            'common.select': 'Seleccionar',
            'common.view': 'Ver',
            'common.manage': 'Gestionar',
            'common.status': 'Estado',
            'common.date': 'Fecha',
            'common.time': 'Hora',
            'common.name': 'Nombre',
            'common.email': 'Correo Electrónico',
            'common.phone': 'Teléfono',
            'common.address': 'Dirección',
            'common.notes': 'Notas',

            // Jobs/Work Orders
            'jobs.active': 'Trabajos Activos',
            'jobs.pending': 'Pendientes',
            'jobs.completed': 'Completados',
            'jobs.create': 'Crear Trabajo',
            'jobs.createOrder': 'Crear Orden de Trabajo',
            'jobs.assign': 'Asignar Trabajador',
            'jobs.accept': 'Aceptar Trabajo',
            'jobs.decline': 'Rechazar Trabajo',
            'jobs.jobSite': 'Sitio de Trabajo',
            'jobs.contractNumber': 'Número de Contrato',
            'jobs.location': 'Ubicación',
            'jobs.status': 'Estado',
            'jobs.dateOut': 'Fecha de Salida',
            'jobs.dateReturn': 'Fecha de Retorno Est.',
            'jobs.vendor': 'Proveedor',
            'jobs.worker': 'Trabajador',
            'jobs.equipment': 'Equipo',
            'jobs.instructions': 'Instrucciones',
            'jobs.details': 'Detalles del Trabajo',
            'jobs.history': 'Historial de Trabajos',
            'jobs.fullHistory': 'Historial Completo',

            // Invoices
            'invoices.create': 'Crear Factura',
            'invoices.total': 'Monto Total',
            'invoices.submit': 'Enviar Factura',
            'invoices.submitted': 'Enviada',
            'invoices.pending': 'Pendiente',
            'invoices.approved': 'Aprobada',
            'invoices.rejected': 'Rechazada',
            'invoices.gallons': 'Galones',
            'invoices.diesel': 'Diésel',
            'invoices.def': 'DEF',
            'invoices.fuelDelivered': 'Combustible Entregado',
            'invoices.unitNumber': 'Número de Unidad',
            'invoices.deliveredBy': 'Entregado Por',
            'invoices.deliveryDate': 'Fecha de Entrega',
            'invoices.totalDelivered': 'Total Entregado',
            'invoices.history': 'Historial de Facturas',
            'invoices.quickbooksId': 'ID QuickBooks',

            // Documents
            'docs.storage': 'Almacenamiento de Documentos',
            'docs.upload': 'Cargar Documento',
            'docs.category': 'Categoría',
            'docs.contracts': 'Contratos',
            'docs.permits': 'Permisos',
            'docs.safetyCerts': 'Certificados de Seguridad',
            'docs.equipmentManuals': 'Manuales de Equipo',
            'docs.other': 'Otro',
            'docs.relatedJob': 'Trabajo Relacionado #',
            'docs.relatedEquipment': 'Equipo Relacionado #',
            'docs.tags': 'Etiquetas',
            'docs.uploadedBy': 'Cargado Por',
            'docs.totalDocuments': 'Total de Documentos',
            'docs.thisMonth': 'Este Mes',
            'docs.storageUsed': 'Almacenamiento Utilizado',
            'docs.dragDrop': 'Arrastra archivos aquí o haz clic para examinar',
            'docs.maxSize': 'Máximo 10MB por archivo',
            'docs.download': 'Descargar',
            'docs.preview': 'Vista Previa',
            'docs.delete': 'Eliminar',
            'docs.share': 'Compartir',
            'docs.noDocuments': 'No se encontraron documentos',

            // Field Worker specific
            'fw.navigate': 'Navegar',
            'fw.clockIn': 'Entrada',
            'fw.clockOut': 'Salida',
            'fw.signature': 'Capturar Firma',
            'fw.photos': 'Tomar Fotos',
            'fw.checklist': 'Lista de Verificación',
            'fw.offline': 'Sin conexión',
            'fw.syncing': 'Sincronizando...',
            'fw.mobileApp': 'Aplicación Móvil',
            'fw.myJobs': 'Mis Trabajos',
            'fw.jobDetails': 'Detalles del Trabajo',
            'fw.completeJob': 'Completar Trabajo',
            'fw.startJob': 'Iniciar Trabajo',
            'fw.incidentReport': 'Reporte de Incidente',
            'fw.reportIncident': 'Reportar Incidente',
            'fw.gpsLocation': 'Ubicación GPS',
            'fw.attachPhotos': 'Adjuntar Fotos',
            'fw.serviceNotes': 'Notas de Servicio',

            // Status
            'status.online': 'En Línea',
            'status.offline': 'Sin Conexión',
            'status.pending': 'Pendiente',
            'status.active': 'Activo',
            'status.completed': 'Completado',
            'status.accepted': 'Aceptado',
            'status.declined': 'Rechazado',
            'status.inProgress': 'En Progreso',
            'status.onHold': 'En Espera',
            'status.cancelled': 'Cancelado',
            'status.available': 'Disponible',
            'status.assigned': 'Asignado',

            // Settings
            'settings.account': 'Cuenta',
            'settings.language': 'Idioma',
            'settings.english': 'English',
            'settings.spanish': 'Español',
            'settings.darkMode': 'Modo Oscuro',
            'settings.notifications': 'Notificaciones',
            'settings.preferences': 'Preferencias',
            'settings.security': 'Seguridad',
            'settings.password': 'Contraseña',
            'settings.logout': 'Cerrar Sesión',
            'settings.profile': 'Perfil',
            'settings.company': 'Empresa',
            'settings.timezone': 'Zona Horaria',
            'settings.units': 'Unidades (Galones/Litros)',

            // Admin
            'admin.users': 'Gestión de Usuarios',
            'admin.companies': 'Empresas',
            'admin.roles': 'Roles',
            'admin.features': 'Indicadores de Características',
            'admin.reports': 'Reportes',
            'admin.analytics': 'Análisis',
            'admin.systemSettings': 'Configuración del Sistema',
            'admin.allOrders': 'Todas las Órdenes',
            'admin.allInvoices': 'Todas las Facturas',
            'admin.allDocuments': 'Todos los Documentos',
            'admin.monitoring': 'Monitoreo',

            // Vendor Dashboard
            'vendor.activeJobs': 'Trabajos Activos',
            'vendor.totalDiesel': 'Diésel Total',
            'vendor.totalDEF': 'DEF Total',
            'vendor.pendingWorkers': 'Trabajadores Pendientes',
            'vendor.recentActivity': 'Actividad Reciente',
            'vendor.jobsbyStatus': 'Trabajos por Estado',
            'vendor.fuelDelivered': 'Combustible Entregado',
            'vendor.dashboard': 'Panel de Proveedor',

            // Rental Dashboard
            'rental.activeOrders': 'Órdenes Activas',
            'rental.totalGallons': 'Galones Totales',
            'rental.myWorkOrders': 'Mis Órdenes de Trabajo',
            'rental.ordersThisWeek': 'Órdenes Esta Semana',
            'rental.ordersByStatus': 'Órdenes por Estado',
            'rental.dashboard': 'Panel de Alquiler',

            // Messages & Alerts
            'msg.welcomeBack': 'Bienvenido de vuelta',
            'msg.goodMorning': 'Buenos días',
            'msg.goodAfternoon': 'Buenas tardes',
            'msg.goodEvening': 'Buenas noches',
            'msg.saved': 'Guardado exitosamente',
            'msg.deleted': 'Eliminado exitosamente',
            'msg.updated': 'Actualizado exitosamente',
            'msg.uploaded': 'Cargado exitosamente',
            'msg.confirmedDelete': '¿Estás seguro de que deseas eliminar esto?',
            'msg.confirmLogout': '¿Estás seguro de que deseas cerrar sesión?',
            'msg.networkError': 'Error de red. Por favor, intenta de nuevo.',
            'msg.sessionExpired': 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
            'msg.unauthorized': 'No tienes permiso para acceder a este recurso.',

            // Analytics & Reports
            'report.title': 'Reporte',
            'report.daily': 'Diario',
            'report.weekly': 'Semanal',
            'report.monthly': 'Mensual',
            'report.custom': 'Personalizado',
            'report.exportAs': 'Exportar Como',
            'report.pdf': 'PDF',
            'report.csv': 'CSV',
            'report.excel': 'Excel',

            // Validation
            'validate.required': 'Este campo es requerido',
            'validate.email': 'Por favor, ingresa un correo electrónico válido',
            'validate.phone': 'Por favor, ingresa un número de teléfono válido',
            'validate.zipCode': 'Por favor, ingresa un código postal válido',
            'validate.minimumLength': 'La longitud mínima es {min} caracteres',
            'validate.maximumLength': 'La longitud máxima es {max} caracteres',
            'validate.matchPassword': 'Las contraseñas no coinciden',
        }
    },

    /**
     * Initialize i18n with stored preference or default language
     */
    init(defaultLang = 'en') {
        this.currentLang = localStorage.getItem('fc_lang') || defaultLang;
        this.applyToPage();
    },

    /**
     * Set language and apply to page
     */
    setLang(lang) {
        if (!this.translations[lang]) {
            console.warn('Language not available:', lang);
            return;
        }
        this.currentLang = lang;
        localStorage.setItem('fc_lang', lang);
        this.applyToPage();

        // Trigger event for listeners
        window.dispatchEvent(new CustomEvent('fc_lang_changed', { detail: { lang } }));
    },

    /**
     * Get translated string for key
     * Supports nested keys with dot notation
     * Optionally replace {variables}
     */
    t(key, replacements = {}) {
        let value = this.translations[this.currentLang]?.[key];

        if (!value) {
            value = this.translations['en']?.[key] || key;
        }

        // Replace variables
        Object.keys(replacements).forEach(varName => {
            value = value.replace('{' + varName + '}', replacements[varName]);
        });

        return value;
    },

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyToPage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            el.placeholder = this.t(key);
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            el.title = this.t(key);
        });

        document.querySelectorAll('[data-i18n-value]').forEach(el => {
            const key = el.dataset.i18nValue;
            el.value = this.t(key);
        });
    },

    /**
     * Get current language
     */
    getLang() {
        return this.currentLang;
    },

    /**
     * Get all available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    },

    /**
     * Check if language is available
     */
    hasLang(lang) {
        return lang in this.translations;
    }
};

// Auto-init on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        FC_i18n.init();
    });
} else {
    FC_i18n.init();
}
