import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Image as ImageIcon, Check, Trash2, Upload } from 'lucide-react';
import api from '../utils/api';

const BulkVariantModal = ({ product, onClose, onSave }) => {
  const [colors, setColors] = useState([]); // { name, image }
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState(product.price);
  const [variantMatrix, setVariantMatrix] = useState({}); // { 'Color-Size': stock }
  const [activePicker, setActivePicker] = useState(null); // color index for image selection
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

  const addColor = () => {
    setColors([...colors, { name: '', image: null }]);
  };

  const removeColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
    if (activePicker === index) setActivePicker(null);
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleStockChange = (colorName, size, stock) => {
    setVariantMatrix(prev => ({
      ...prev,
      [`${colorName}-${size}`]: parseInt(stock) || 0
    }));
  };

    const handleGenerate = () => {
    if (colors.some(c => !c.name)) {
      alert("Please enter names for all colors");
      return;
    }
    if (selectedSizes.length === 0) {
      alert("Please select at least one size");
      return;
    }

    const newVariants = [];
    colors.forEach(color => {
      selectedSizes.forEach(size => {
        const stock = variantMatrix[`${color.name}-${size}`] || 0;
        newVariants.push({
          title: `Color: ${color.name}, Size: ${size}`,
          price: useDefaultPrice ? null : parseFloat(customPrice),
          stock: stock,
          images: color.image ? [color.image] : []
        });
      });
    });

    onGenerate(newVariants);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white w-full max-w-[950px] rounded-[12px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Create Variants</h2>
            <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Bulk configure options, pricing, and inventory</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          
          {/* Options Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Color section */}
            <div className="space-y-4">
              <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Color Options</label>
              <div className="space-y-3">
                {colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl group/color">
                    <div className="relative" ref={activePicker === index ? pickerRef : null}>
                      <button 
                        type="button"
                        onClick={() => setActivePicker(activePicker === index ? null : index)}
                        className="relative w-10 h-12 bg-white rounded-lg border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-black transition-all"
                      >
                        {color.image ? (
                          <img src={color.image} className="w-full h-full object-cover" />
                        ) : (
                          <Plus size={14} className="text-gray-300" />
                        )}
                      </button>

                      {activePicker === index && (
                        <div className="absolute top-0 left-full ml-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[120] p-3 animate-in fade-in slide-in-from-left-2">
                          <div className="flex items-center justify-between p-2 border-b mb-2">
                             <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Select Media</p>
                             <button onClick={() => setActivePicker(null)}><X size={12} className="text-gray-400" /></button>
                          </div>
                          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                            {product.images?.map((img, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => {
                                  const newColors = [...colors];
                                  newColors[index].image = img;
                                  setColors(newColors);
                                  setActivePicker(null);
                                }}
                                className={`aspect-[3/4] rounded-lg border transition-all overflow-hidden ${color.image === img ? 'ring-2 ring-black border-black' : 'hover:border-black'}`}
                              >
                                <img src={img} className="w-full h-full object-cover" />
                              </button>
                            ))}
                            {(!product.images || product.images.length === 0) && (
                              <p className="col-span-4 py-4 text-center text-[0.5rem] font-bold text-gray-400 uppercase">No media uploaded</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Midnight Blue" 
                      value={color.name}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[index].name = e.target.value;
                        setColors(newColors);
                      }}
                      className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold placeholder:text-gray-300"
                    />
                    <button onClick={() => removeColor(index)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/color:opacity-100 transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={addColor} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[0.65rem] font-black text-gray-400 uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> Add Color
                </button>
              </div>
            </div>

            {/* Size section */}
            <div className="space-y-4">
              <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Available Sizes</label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button 
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all border-2 ${selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          {colors.length > 0 && selectedSizes.length > 0 && (
            <div className="space-y-4">
              <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Stock Matrix</label>
              <div className="border border-gray-100 rounded-[12px] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Color \ Size</th>
                      {selectedSizes.map(size => (
                        <th key={size} className="px-6 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest text-center">{size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {colors.map((color, colorIdx) => (
                      <tr key={colorIdx}>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-10 bg-gray-50 rounded border overflow-hidden">
                            {color.image && <img src={color.image} className="w-full h-full object-cover" />}
                          </div>
                          <span className="text-xs font-black uppercase text-gray-900">{color.name || 'Untitled'}</span>
                        </td>
                        {selectedSizes.map(size => (
                          <td key={size} className="px-4 py-2">
                            <input 
                              type="number" 
                              placeholder="0"
                              onChange={(e) => handleStockChange(color.name, size, e.target.value)}
                              className="w-full p-2 bg-gray-50 border border-transparent rounded-lg text-xs font-black text-center focus:bg-white focus:border-black transition-all"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pricing Section */}
          <div className="p-8 bg-gray-50 rounded-[12px] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Pricing Configuration</h3>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="defaultPrice" 
                  checked={useDefaultPrice}
                  onChange={(e) => setUseDefaultPrice(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="defaultPrice" className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest cursor-pointer">Use default product price (₹{product.price})</label>
              </div>
            </div>
            
            {!useDefaultPrice && (
              <div className="max-w-xs space-y-2">
                <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Custom Variant Price (₹)</label>
                <input 
                  type="number" 
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-black focus:border-black transition-all"
                />
              </div>
            )}
          </div>

        </div>

        {/* Actions */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-8 py-3 text-[0.7rem] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
          <button 
            onClick={handleGenerate}
            disabled={colors.length === 0 || selectedSizes.length === 0}
            className="px-10 py-4 bg-black text-white rounded-xl text-[0.7rem] font-black uppercase tracking-[2px] shadow-xl shadow-black/10 active:scale-95 transition-all disabled:opacity-30"
          >
            Generate Variants
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkVariantModal;
