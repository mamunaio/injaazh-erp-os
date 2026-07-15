const fs = require('fs');
const file = 'app/prospects/LeadsClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
    "import LeadSlidePanel from '@/components/leads/ui/LeadSlidePanel';",
    "import LeadSlidePanel from '@/components/leads/ui/LeadSlidePanel';\nimport LeadDetailsModal from '@/components/leads/LeadDetailsModal';"
);

// 2. Add State
content = content.replace(
    "const [selectedLead, setSelectedLead] = useState<any>(null);",
    "const [selectedLead, setSelectedLead] = useState<any>(null);\n  const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n  const [leadToEdit, setLeadToEdit] = useState<any>(null);"
);

// 3. Add handleUpdateLead
const updateLeadLogic = `
  const handleUpdateLead = async (id: string, data: any) => {
    try {
      const result = await updateLead(id, data);
      if (result.success && result.data) {
        setLeads(leads.map((l: any) => l._id === id ? result.data : l));
        if (selectedLead?._id === id) setSelectedLead(result.data);
        toast.success('Lead updated successfully');
      } else {
        toast.error(result.error || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('An error occurred');
    }
  };

  const handleDeleteClick = (lead: any, e: React.MouseEvent) => {
`;
content = content.replace(
    "const handleDeleteClick = (lead: any, e: React.MouseEvent) => {",
    updateLeadLogic
);

// 4. Update LeadSlidePanel onEdit
content = content.replace(
    "onStatusChange={async (leadId, newStatus) => {",
    "onEdit={(lead: any) => {\n          setLeadToEdit(lead);\n          setIsEditModalOpen(true);\n        }}\n        onStatusChange={async (leadId, newStatus) => {"
);

// 5. Add Modal in JSX
const editModalJSX = `
      {/* Edit Lead Modal */}
      <LeadDetailsModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={leadToEdit}
        onUpdateLead={handleUpdateLead}
      />
    </div>
`;
content = content.replace("    </div>\n  );\n}", editModalJSX + "  );\n}");

fs.writeFileSync(file, content, 'utf8');
console.log("Patched!");
