const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/leads/LeadsClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix toast.success(result.message) -> toast.success(result.message || 'Deleted successfully')
content = content.replace(/toast\.success\(result\.message\);/g, "toast.success(result.message || 'Success');");

// 2. Fix CSVImportModal props in the old JSX block
content = content.replace(/<CSVImportModal\s+isOpen=\{isCSVModalOpen\}\s+onClose=\{.*?\}\s+onImportSuccess=\{.*?\}\s+\/>/g, `<CSVImportModal 
        isOpen={isCSVModalOpen} 
        onClose={() => setIsCSVModalOpen(false)} 
        onSuccess={() => {
          router.refresh();
        }} 
      />`);

// 3. Fix OutreachComposerModal props in the old JSX block
content = content.replace(/<OutreachComposerModal[\s\S]*?\/>/g, `<OutreachComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        lead={composerLead}
        onEmailSent={(updatedLead) => {
          if(updatedLead) {
            setLeads(leads.map(l => l._id === updatedLead._id ? updatedLead : l));
          }
        }}
      />`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed typings in LeadsClient.tsx');
