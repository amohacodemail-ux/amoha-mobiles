import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { serviceRequestService } from '@/services/service-request.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICE_CATEGORIES = [
  {
    title: 'Display & Screen',
    services: ['Display Change', 'Tempered Glass Application', 'Panel Change'],
  },
  {
    title: 'Battery & Charging',
    services: ['Battery Change', 'Charging Port Repair'],
  },
  {
    title: 'Internal Modules',
    services: [
      'Power Module Repair',
      'Network Module Repair',
      'Audio Module Repair',
      'Camera Repair',
      'Button Repair',
      'Fingerprint Sensor Repair',
      'Bluetooth Module Repair',
      'WiFi Module Repair',
    ],
  },
  {
    title: 'Body & Casing',
    services: ['Front Case Change', 'Back Case Change'],
  },
];

export function WalkInRegistrationModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceBrand: '',
    deviceModel: '',
    serviceType: '',
    description: '',
    imeiOrSerialNumber: '',
  });

  const [customerPhoto, setCustomerPhoto] = useState<File | null>(null);
  const [devicePhoto, setDevicePhoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.deviceBrand || !formData.deviceModel || !formData.serviceType) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let customerPhotoUrl = '';
      let devicePhotoUrl = '';

      // Upload photos first if provided
      if (customerPhoto || devicePhoto) {
        const uploadForm = new FormData();
        if (customerPhoto) uploadForm.append('customerPhoto', customerPhoto);
        if (devicePhoto) uploadForm.append('devicePhoto', devicePhoto);

        const uploadRes = await serviceRequestService.uploadPhotos(uploadForm);
        customerPhotoUrl = uploadRes.customerPhotoUrl || '';
        devicePhotoUrl = uploadRes.devicePhotoUrl || '';
      }

      // Create walk-in request
      await serviceRequestService.createWalkIn({
        ...formData,
        customerPhotoUrl,
        devicePhotoUrl,
      });

      toast.success('Walk-in registered successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register walk-in');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Walk-in Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">Customer Details</h4>
              <Input name="customerName" label="Name *" value={formData.customerName} onChange={handleChange} required />
              <Input name="customerPhone" label="Phone *" value={formData.customerPhone} onChange={handleChange} required />
              <Input name="customerEmail" label="Email" type="email" value={formData.customerEmail} onChange={handleChange} />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Customer Photo</label>
                <Input type="file" accept="image/*" onChange={(e) => setCustomerPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Device Details</h4>
              <Input name="deviceBrand" label="Brand *" value={formData.deviceBrand} onChange={handleChange} required />
              <Input name="deviceModel" label="Model *" value={formData.deviceModel} onChange={handleChange} required />
              <Input name="imeiOrSerialNumber" label="IMEI / Serial Number" value={formData.imeiOrSerialNumber} onChange={handleChange} />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Device Photo</label>
                <Input type="file" accept="image/*" onChange={(e) => setDevicePhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border">
            <h4 className="font-medium">Service Details</h4>

            {/* Service Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Service Type <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.serviceType}
                onValueChange={(val) => setFormData(prev => ({ ...prev, serviceType: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <React.Fragment key={cat.title}>
                      {/* Category header */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 select-none">
                        {cat.title}
                      </div>
                      {cat.services.map((service) => (
                        <SelectItem key={service} value={service} className="pl-5">
                          {service}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              name="description"
              label="Issue Description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" loading={loading}>Register</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
