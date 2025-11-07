
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Code,
  Palette
} from "lucide-react";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

const DEFAULT_EXPENSE_HTML = `<div class="invoice-container">
  <div class="header">
    <div class="company-name">{{company_name}}</div>
    <div class="company-tagline">{{company_tagline}}</div>
    <div class="invoice-type">وەسڵی خەرجی</div>
  </div>
  
  <div class="invoice-details">
    <div class="detail-section">
      <div class="section-title">زانیاری گشتی</div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">بەروار</div>
          <div class="detail-value">{{expense_date}}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">جۆری خەرجی</div>
          <div class="detail-value">{{expense_type}}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">ناوی شۆفێر</div>
          <div class="detail-value">{{driver_name}}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">ژمارەی شۆفێر</div>
          <div class="detail-value">{{driver_number}}</div>
        </div>
      </div>
    </div>
    
    <div class="amount-highlight">
      <div class="amount-label">کۆی گشتی</div>
      <div class="amount-value">{{amount}}</div>
      <div class="amount-currency">{{currency_label}}</div>
      <div class="status-badge {{payment_status_class}}">
        {{payment_status}}
      </div>
    </div>
  </div>
  
  <div class="footer">
    <div class="footer-date">چاپکراوە لە {{print_date}}</div>
    <div class="footer-notice">ئەم وەسڵە بە سیستەمی ئۆتۆماتیک دەرچووە</div>
  </div>
</div>`;

const DEFAULT_EXPENSE_CSS = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

* {
  font-family: 'Noto Sans Arabic', sans-serif;
  direction: rtl;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  padding: 40px;
  background: #f9fafb;
}

.invoice-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 30px rgba(0,0,0,0.1);
}

.header {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.company-name {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.company-tagline {
  font-size: 16px;
  opacity: 0.95;
}

.invoice-type {
  background: rgba(255,255,255,0.2);
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 600;
}

.invoice-details {
  padding: 40px;
}

.detail-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #059669;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  border-right: 4px solid #059669;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 5px;
  font-weight: 600;
}

.detail-value {
  font-size: 16px;
  color: #111827;
  font-weight: 700;
}

.amount-highlight {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  margin: 30px 0;
  box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);
}

.amount-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.amount-value {
  font-size: 48px;
  font-weight: 800;
  margin: 10px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.status-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 10px;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.footer {
  background: #f9fafb;
  padding: 30px;
  text-align: center;
  border-top: 3px solid #e5e7eb;
}

.footer-date {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

@media print {
  body {
    padding: 0;
    background: white;
  }
  
  .invoice-container {
    box-shadow: none;
  }
}`;

const DEFAULT_HTML = `<!-- ========== سەرپەڕ / HEADER ========== -->
<div class="header">
  <h1>{{company_name}}</h1>
  <p>{{company_tagline}}</p>
  <p>{{report_period}}</p>
</div>

<!-- ========== خشتە / TABLE ========== -->
<div class="content">
  <table>
    <thead>
      <tr>{{table_headers}}</tr>
    </thead>
    <tbody>
      {{table_rows}}
      {{total_rows}}
    </tbody>
  </table>
</div>

<!-- ========== پێپەڕ / FOOTER ========== -->
<div class="footer">
  <p>چاپکراوە لە {{print_date}}</p>
  <p>{{company_name}} • {{company_tagline}}</p>
</div>`;

const DEFAULT_CSS = `/* ========== فۆنت / FONTS ========== */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

* {
  font-family: 'Noto Sans Arabic', sans-serif;
  direction: rtl;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  padding: 20px;
  background: #f9fafb;
  font-size: 12px;
}

/* ========== سەرپەڕ / HEADER ========== */
.header {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  padding: 30px;
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 5px;
}

.header p {
  font-size: 16px;
  opacity: 0.9;
  margin: 3px 0;
}

/* ========== خشتە / TABLE ========== */
.content {
  padding: 0 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  background: white;
}

th {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 10px 8px;
  text-align: right;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  color: #374151;
  border-bottom: 2px solid #d1d5db;
}

td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.employee-row {
  background: #f0e6fa;
}

.total-row {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  font-weight: 800;
  font-size: 12px;
}

.total-row td {
  padding: 15px 8px;
  border: none;
  color: white;
}

/* ========== پێپەڕ / FOOTER ========== */
.footer {
  background: #f9fafb;
  padding: 20px;
  text-align: center;
  border-top: 2px solid #e5e7eb;
  margin-top: 20px;
}

.footer p {
  font-size: 11px;
  color: #6b7280;
  margin: 5px 0;
}

/* ========== چاپکردن / PRINT ========== */
@media print {
  body {
    padding: 0;
    background: white;
  }
}`;

export default function PrintTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'bulk_report', // Changed default type
    html_content: DEFAULT_HTML, // Changed default HTML
    css_content: DEFAULT_CSS, // Changed default CSS
    is_default: false,
    description: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['printTemplates'],
    queryFn: () => base44.entities.PrintTemplate.list(),
    initialData: [],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.PrintTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printTemplates'] });
      setShowDialog(false);
      setEditingTemplate(null);
      setSuccess('تێمپلەیت بە سەرکەوتوویی دروستکرا!');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrintTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printTemplates'] });
      setShowDialog(false);
      setEditingTemplate(null);
      setSuccess('تێمپلەیت بە سەرکەوتوویی نوێکرایەوە!');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.PrintTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printTemplates'] });
      setSuccess('تێمپلەیت بە سەرکەوتوویی سڕایەوە!');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const handleSetDefault = async (template) => {
    try {
      // Unset all other templates of the same type that are currently default
      const sameTypeDefaultTemplates = templates.filter(
        t => t.template_type === template.template_type && t.id !== template.id && t.is_default
      );
      for (const t of sameTypeDefaultTemplates) {
        await updateTemplateMutation.mutateAsync({
          id: t.id,
          data: { is_default: false }
        });
      }

      // Set this template as default
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: { is_default: true }
      });

      setSuccess('تێمپلەیت وەک بنەڕەتی دانرا!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('هەڵە لە دانانی تێمپلەیت وەک بنەڕەتی');
      console.error("Error setting default template:", err);
    }
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: formData
      });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_type: template.template_type,
      html_content: template.html_content,
      css_content: template.css_content || '',
      is_default: template.is_default,
      description: template.description || ''
    });
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('دڵنیایت لە سڕینەوەی ئەم تێمپلەیتە؟')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setFormData({
      template_name: '',
      template_type: 'bulk_report', // Changed default type
      html_content: DEFAULT_HTML, // Changed default HTML
      css_content: DEFAULT_CSS, // Changed default CSS
      is_default: false,
      description: ''
    });
    setShowDialog(true);
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const getTemplateTypeLabel = (type) => {
    const labels = {
      expense_receipt: 'وەسڵی خەرجی',
      employee_receipt: 'وەسڵی مووچە',
      bulk_report: 'ڕاپۆرتی گشتی' // Added new type
    };
    return labels[type] || type;
  };

  const generatePreviewHtml = (template) => {
    let previewHtml = template.html_content;

    if (template.template_type === 'expense_receipt') {
      previewHtml = previewHtml
        .replace(/\{\{company_name\}\}/g, 'نەسرەدین رۆژبەیانی')
        .replace(/\{\{company_tagline\}\}/g, 'کۆمپانیای کرێی ئامێرەکان')
        .replace(/\{\{expense_date\}\}/g, '2025-10-30')
        .replace(/\{\{expense_type\}\}/g, 'شۆفێر بچووک')
        .replace(/\{\{driver_name\}\}/g, 'هێر')
        .replace(/\{\{driver_number\}\}/g, '001')
        .replace(/\{\{amount\}\}/g, '800,000')
        .replace(/\{\{currency_label\}\}/g, 'دیناری عێراقی')
        .replace(/\{\{payment_status_class\}\}/g, 'status-paid')
        .replace(/\{\{payment_status\}\}/g, '✓ پارەدراوە')
        .replace(/\{\{print_date\}\}/g, '2025-11-01 • 15:30');
    } else if (template.template_type === 'bulk_report') {
      previewHtml = previewHtml
        .replace(/\{\{company_name\}\}/g, 'نەسرەدین رۆژبەیانی')
        .replace(/\{\{company_tagline\}\}/g, 'کۆمپانیای کرێی ئامێرەکان')
        .replace(/\{\{report_period\}\}/g, 'سەرجەم ڕاپۆرت لە 2023/01/01 تا 2023/12/31')
        .replace(/\{\{table_headers\}\}/g, `<th>#</th><th>ناوی ئۆتۆمبێل</th><th>ژمارەی مۆبایل</th><th>بڕی قەرز</th><th>دۆخ</th>`)
        .replace(/\{\{table_rows\}\}/g, `
          <tr><td>1</td><td>شۆفێر 1</td><td>07701234567</td><td>1,500,000</td><td><span class="status-unpaid status-badge">قەرز</span></td></tr>
          <tr><td>2</td><td>شۆفێر 2</td><td>07709876543</td><td>2,000,000</td><td><span class="status-unpaid status-badge">قەرز</span></td></tr>
          <tr class="employee-row"><td>3</td><td>کارمەند 1</td><td>07501112233</td><td>500,000</td><td><span class="status-paid status-badge">دراوە</span></td></tr>
        `)
        .replace(/\{\{total_rows\}\}/g, `<tr><td colspan="3">کۆی گشتی</td><td>4,000,000</td><td></td></tr>`)
        .replace(/\{\{print_date\}\}/g, '2023-10-27 | 10:00 AM');
    }
    // Add other template types here if needed

    return previewHtml;
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>تەنها بەڕێوەبەر دەتوانێت دەستگەیشتن بەم لاپەڕەیە هەبێت</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">تێمپلەیتەکانی چاپکردن</h1>
            <p className="text-gray-600 mt-1">بەڕێوەبردن و دەستکاریکردنی دیزاینی چاپکردن</p>
          </div>
          <Button onClick={handleNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            تێمپلەیتی نوێ
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`border-none shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                template.is_default ? 'ring-2 ring-emerald-500' : ''
              }`}
              onClick={() => !template.is_default && handleSetDefault(template)}
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      {template.is_default && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">
                        {getTemplateTypeLabel(template.template_type)}
                      </Badge>
                      {template.is_default && (
                        <Badge className="bg-emerald-100 text-emerald-800">✓ بنەڕەتی</Badge>
                      )}
                    </div>
                  </div>
                  <Printer className="w-8 h-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}
                {!template.is_default && (
                  <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800 text-xs">
                      کلیک بکە بۆ دانانی وەک تێمپلەیتی بنەڕەتی
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    پێشبینین
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(template);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    دەستکاری
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <Card className="col-span-full border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center">
                <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">هیچ تێمپلەیتێک نییە</h3>
                <p className="text-gray-600 mb-4">تێمپلەیتی یەکەمت دروستبکە بۆ دەستکاریکردنی دیزاینی چاپکردن</p>
                <Button onClick={handleNew} className="gap-2">
                  <Plus className="w-4 h-4" />
                  دروستکردنی تێمپلەیت
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingTemplate ? 'دەستکاریکردنی تێمپلەیت' : 'دروستکردنی تێمپلەیتی نوێ'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4"> {/* Kept this structure for template_name and type */}
                <div className="space-y-2">
                  <Label>ناوی تێمپلەیت</Label>
                  <Input
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="دیزاینی نوێ" // Updated placeholder
                  />
                </div>

                <div className="space-y-2">
                  <Label>جۆری تێمپلەیت</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense_receipt">وەسڵی خەرجی</SelectItem>
                      <SelectItem value="employee_receipt">وەسڵی مووچە</SelectItem>
                      <SelectItem value="bulk_report">ڕاپۆرتی گشتی</SelectItem> {/* Added bulk_report */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>وەسف</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وەسفی کورتی تێمپلەیت"
                />
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>ئاگاداربە:</strong> ئەم کۆدە HTML و CSS ە. تەنها دەستکاری بکە ئەگەر زانیاریت هەبوو. بۆ گۆڕینی تەنها سەرپەڕ و پێپەڕ، لە کۆدەکە بگەڕێ بۆ:
                  <code className="block mt-2 bg-white p-2 rounded text-xs">
                    &lt;!-- سەرپەڕ / HEADER --&gt; یان &lt;!-- پێپەڕ / FOOTER --&gt;
                  </code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>کۆدی HTML (سەرپەڕ و پێپەڕ)</Label> {/* Updated Label */}
                  <Badge variant="outline" className="gap-2">
                    <Code className="w-3 h-3" />
                    گەڕان بۆ: &lt;!-- سەرپەڕ --&gt;
                  </Badge>
                </div>
                <Textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  rows={12} // Updated rows
                  className="font-mono text-xs"
                  placeholder="<div>...</div>"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>کۆدی CSS (ڕەنگەکان و فۆنت)</Label> {/* Updated Label */}
                  <Badge variant="outline" className="gap-2">
                    <Palette className="w-3 h-3" />
                    گەڕان بۆ: /* سەرپەڕ / HEADER */
                  </Badge>
                </div>
                <Textarea
                  value={formData.css_content}
                  onChange={(e) => setFormData({ ...formData, css_content: e.target.value })}
                  rows={12} // Updated rows
                  className="font-mono text-xs"
                  placeholder=".header { ... }"
                />
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>نموونەی گۆڕانکاری:</strong>
                  <ul className="list-disc mr-5 mt-2 text-xs space-y-1">
                    <li>بۆ گۆڕینی ڕەنگ لە CSS: <code>background: #059669</code> بگۆڕە بۆ <code>background: #E95420</code></li>
                    <li>بۆ گۆڕینی قەبارەی فۆنت: <code>font-size: 32px</code> بگۆڕە بۆ <code>font-size: 40px</code></li>
                    <li>بۆ زیادکردنی دێڕ لە پێپەڕ: لە HTML زیاد بکە <code>&lt;p&gt;تێبینی نوێ&lt;/p&gt;</code></li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                پاشگەزبوونەوە
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.template_name || !formData.html_content}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingTemplate ? 'نوێکردنەوە' : 'دروستکردن'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>پێشبینینی تێمپلەیت</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="border rounded-lg overflow-hidden bg-white">
                <style dangerouslySetInnerHTML={{ __html: previewTemplate.css_content }} />
                <div dangerouslySetInnerHTML={{
                  __html: generatePreviewHtml(previewTemplate)
                }} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
