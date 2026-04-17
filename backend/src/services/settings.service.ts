import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

class SettingsService {
  async getSettings() {
    const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    if (error) throw error;
    if (!data) {
      // Create default settings
      const { data: created, error: createErr } = await supabase
        .from('site_settings').insert({ site_name: 'AMOHA Mobiles' }).select('*').single();
      if (createErr) throw createErr;
      return transformRow(created);
    }
    return transformRow(data);
  }

  async updateSettings(updates: any) {
    const { data: existing } = await supabase.from('site_settings').select('id').limit(1).maybeSingle();
    if (!existing) {
      const { data, error } = await supabase.from('site_settings').insert(toDbRow(updates)).select('*').single();
      if (error) throw error;
      return transformRow(data);
    }
    const { data, error } = await supabase.from('site_settings').update(toDbRow(updates)).eq('id', existing.id).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updatePopupSettings(popup: any) {
    return this.updateSettings({ popup });
  }

  async updatePolicies(policies: any) {
    return this.updateSettings({ policies });
  }

  async updateBillingSettings(billing: any) {
    return this.updateSettings({ billing });
  }

  async updateDiscoverBanners(banners: any) {
    return this.updateSettings({ discover_banners: banners });
  }

  async updatePromoBanners(banners: any) {
    return this.updateSettings({ promo_banner: banners });
  }

  // Controller aliases
  async get() { return this.getSettings(); }
  async update(data: any) { return this.updateSettings(data); }
}

export default new SettingsService();
