import { useState } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { UploadCloud } from 'lucide-react';

export const PostItem = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'electronics', location_found: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload an image of the item.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      // 3. Save Item in DB
      await api.createItem({
        ...formData,
        image_url: publicUrl
      });

      alert("Item posted successfully!");
      setFormData({ title: '', description: '', category: 'electronics', location_found: '' });
      setFile(null);
    } catch (err) {
      alert("Error posting item: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Post a Found Item</h1>
          <p style={{ color: 'var(--text-muted)' }}>Help someone recover their lost belongings.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input required type="text" name="title" className="input-glass" placeholder="e.g. Blue Hydroflask" value={formData.title} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea required name="description" className="input-glass" rows={4} placeholder="Describe the item, including any distinct marks..." value={formData.description} onChange={handleChange} style={{ resize: 'none' }} />
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Category</label>
              <select required name="category" className="input-glass" value={formData.category} onChange={handleChange} style={{ appearance: 'none' }}>
                <option value="electronics">Electronics</option>
                <option value="documents">IDs & Documents</option>
                <option value="accessories">Accessories/Bags</option>
                <option value="clothing">Clothing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location Found</label>
              <input required type="text" name="location_found" className="input-glass" placeholder="e.g. Library 2nd Floor" value={formData.location_found} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Image of the Item</label>
            <div style={{ padding: '24px', border: '2px dashed var(--border-glass)', borderRadius: '8px', textAlign: 'center', marginBottom: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <input required type="file" accept="image/*" onChange={handleFileChange} style={{ cursor: 'pointer' }} />
              {file && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--primary)' }}>Selected: {file.name}</p>}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Uploading...' : 'Post Item'}
          </button>
        </form>
      </div>
    </div>
  );
};
