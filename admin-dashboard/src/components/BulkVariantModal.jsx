import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Image as ImageIcon, Check, Trash2, Upload, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const BulkVariantModal = ({ product, onClose, onGenerate, mode = 'create' }) => {
  const [colors, setColors] = useState([]); // { name, images: [] }
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [colorPrices, setColorPrices] = useState({}); // { index/name: { useDefault: boolean, price: number } }
  const [variantMatrix, setVariantMatrix] = useState({}); // { 'Color-Size': stock }
  const [activePicker, setActivePicker] = useState(null); // color index for image selection
  const [isGenerating, setIsGenerating] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (mode === 'edit' && product.variants?.length > 0) {
      const uniqueColorsMap = new Map();
      const uniqueSizes = new Set();
      const matrix = {};
      const prices = {};

      product.variants.forEach(v => {
        const parts = v.title.split(', ');
        let colorName = '';
        let sizeName = '';
        parts.forEach(p => {
          if (p.startsWith('Color: ')) colorName = p.replace('Color: ', '');
          if (p.startsWith('Size: ')) sizeName = p.replace('Size: ', '');
        });

        if (colorName) {
          if (!uniqueColorsMap.has(colorName)) {
            uniqueColorsMap.set(colorName, v.images || []);
            prices[colorName] = { 
              useDefault: v.price === null, 
              price: v.price || product.price 
            };
          }
        }
        if (sizeName) uniqueSizes.add(sizeName);
        if (colorName && sizeName) {
          matrix[`${colorName}-${sizeName}`] = v.stock;
        }
      });

      setColors(Array.from(uniqueColorsMap.entries()).map(([name, images]) => ({ name, images })));
      setSelectedSizes(Array.from(uniqueSizes));
      setVariantMatrix(matrix);
      setColorPrices(prices);
    }
  }, [mode, product.variants, product.price]);

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
    setColors([...colors, { name: '', images: [] }]);
  };

  const removeColor = (index) => {
    const colorName = colors[index].name;
    setColors(colors.filter((_, i) => i !== index));
    const newColorPrices = { ...colorPrices };
    delete newColorPrices[colorName];
    setColorPrices(newColorPrices);
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

  const handleGenerate = async () => {
    if (colors.length === 0) {
      alert("Please add at least one color");
      return;
    }
    if (colors.some(c => !c.name)) {
      alert("Please enter names for all colors");
      return;
    }
    if (selectedSizes.length === 0) {
      alert("Please select at least one size");
      return;
    }

    setIsGenerating(true);
    
    // Artificial delay to show processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const newVariants = [];
    colors.forEach((color, idx) => {
      const config = colorPrices[color.name] || { useDefault: true, price: product.price };
      const priceForColor = config.useDefault ? null : (parseFloat(config.price) || 0);
      
      selectedSizes.forEach(size => {
        const stock = variantMatrix[`${color.name}-${size}`] || 0;
        newVariants.push({
          title: `Color: ${color.name}, Size: ${size}`,
          price: priceForColor,
          stock: stock,
          images: color.images || []
        });
      });
    });

    onGenerate(newVariants);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white w-full max-w-[1000px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col border border-white/20">
        {/* Header */}
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic-none uppercase">Advanced Variant Architect</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest">Multi-attribute bulk engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"><X size={24} strokeWidth={2.5} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar bg-gray-50/30">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Options Entry */}
            <div className="lg:col-span-12 space-y-10">
              
              {/* Color section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">1. Define Color Palette</label>
                  <button onClick={addColor} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10">
                    <Plus size={14} strokeWidth={3} /> Add Color
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colors.map((color, index) => (
                    <div key={index} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group/color relative border-l-4 border-l-black/10 hover:border-l-black">
                      <div className="flex gap-6">
                        {/* Image Picker */}
                        <div className="relative" ref={activePicker === index ? pickerRef : null}>
                          <button 
                            type="button"
                            onClick={() => setActivePicker(activePicker === index ? null : index)}
                            className="relative w-16 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex-shrink-0 flex flex-col items-center justify-center hover:border-black transition-all group/img"
                          >
                            {color.images?.length > 0 ? (
                              <>
                                <img src={color.images[0]} className="w-full h-full object-cover" />
                                {color.images.length > 1 && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white text-[0.6rem] font-black">+{color.images.length - 1}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="text-gray-300 mb-1 group-hover/img:scale-110 transition-transform" />
                                <span className="text-[0.5rem] font-black text-gray-400 uppercase tracking-tighter">Media</span>
                              </>
                            )}
                          </button>

                          {activePicker === index && (
                            <div className="absolute top-0 left-full ml-4 w-72 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[120] p-6 animate-in fade-in slide-in-from-left-4 ring-1 ring-black/5">
                              <div className="flex items-center justify-between mb-4">
                                 <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Select Visuals</p>
                                 <button onClick={() => setActivePicker(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
                              </div>
                              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto no-scrollbar p-1">
                                {product.images?.map((img, imgIdx) => {
                                  const isSelected = color.images?.includes(img);
                                  return (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      onClick={() => {
                                        const newColors = [...colors];
                                        const currentImages = newColors[index].images || [];
                                        if (isSelected) {
                                          newColors[index].images = currentImages.filter(i => i !== img);
                                        } else {
                                          newColors[index].images = [...currentImages, img];
                                        }
                                        setColors(newColors);
                                      }}
                                      className={`aspect-[3/4] rounded-xl border-2 transition-all overflow-hidden relative ${isSelected ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
                                    >
                                      <img src={img} className="w-full h-full object-cover" />
                                      {isSelected && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center scale-75">
                                          <Check size={10} strokeWidth={4} />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                                {(!product.images || product.images.length === 0) && (
                                  <div className="col-span-4 py-8 text-center bg-gray-50 rounded-2xl">
                                    <ImageIcon size={20} className="mx-auto text-gray-300 mb-2 opacity-20" />
                                    <p className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-widest">No assets available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Inputs */}
                        <div className="flex-1 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block ml-1">Color Name</label>
                            <input 
                              type="text" 
                              placeholder="Midnight Blue" 
                              value={color.name}
                              onChange={(e) => {
                                const newColors = [...colors];
                                newColors[index].name = e.target.value;
                                setColors(newColors);
                              }}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight focus:bg-white focus:border-black transition-all outline-none"
                            />
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex items-center justify-between px-1">
                               <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                               <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    id={`useDefault-${index}`}
                                    checked={colorPrices[color.name]?.useDefault !== false}
                                    onChange={(e) => {
                                      setColorPrices({
                                        ...colorPrices,
                                        [color.name]: { 
                                          ...colorPrices[color.name], 
                                          useDefault: e.target.checked,
                                          price: colorPrices[color.name]?.price || product.price
                                        }
                                      });
                                    }}
                                    className="w-3 h-3 rounded" 
                                  />
                                  <label htmlFor={`useDefault-${index}`} className="text-[0.55rem] font-black text-gray-400 uppercase">Use Default</label>
                               </div>
                             </div>
                             {colorPrices[color.name]?.useDefault === false && (
                               <div className="relative animate-in slide-in-from-top-2 duration-300">
                                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-black text-gray-300">₹</span>
                                 <input 
                                   type="number" 
                                   min="0"
                                   value={colorPrices[color.name]?.price || ''}
                                   onChange={(e) => {
                                     setColorPrices({
                                       ...colorPrices,
                                       [color.name]: { ...colorPrices[color.name], price: e.target.value }
                                     });
                                   }}
                                   className="w-full bg-gray-50/50 border border-gray-100 rounded-xl pl-6 pr-4 py-2 text-xs font-black focus:bg-white focus:border-black transition-all outline-none"
                                 />
                               </div>
                             )}
                          </div>
                        </div>

                        <button onClick={() => removeColor(index)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size section */}
              <div className="space-y-6">
                <label className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">2. Select Available Sizes</label>
                <div className="flex flex-wrap gap-4">
                  {availableSizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-8 py-4 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest transition-all border-2 ${selectedSizes.includes(size) ? 'bg-black text-white border-black shadow-xl shadow-black/10 scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            {colors.length > 0 && selectedSizes.length > 0 && (
              <div className="lg:col-span-12 space-y-6 pt-6">
                <label className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">3. Inventory Blueprint</label>
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/[0.02]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-5 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Color \ Size</th>
                        {selectedSizes.map(size => (
                          <th key={size} className="px-8 py-5 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100">{size}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {colors.map((color, colorIdx) => (
                        <tr key={colorIdx} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-8 py-6 flex items-center gap-4">
                            <div className="w-10 h-14 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                              {color.images?.length > 0 && <img src={color.images[0]} className="w-full h-full object-cover" />}
                            </div>
                            <span className="text-[0.7rem] font-black uppercase tracking-tight text-gray-900">{color.name || 'Untitled'}</span>
                          </td>
                          {selectedSizes.map(size => (
                            <td key={size} className="px-6 py-4">
                              <input 
                                type="number" 
                                min="0"
                                value={variantMatrix[`${color.name}-${size}`] || ''}
                                onChange={(e) => handleStockChange(color.name, size, e.target.value)}
                                className="w-full bg-gray-50/50 border border-transparent rounded-xl px-4 py-3 text-xs font-black text-center focus:bg-white focus:border-black focus:shadow-lg transition-all outline-none"
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
          </div>


        </div>

        {/* Actions */}
        <div className="px-10 py-8 border-t border-gray-100 bg-white flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <button onClick={onClose} className="px-8 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all">Abort Process</button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || colors.length === 0 || selectedSizes.length === 0}
            className="group relative flex items-center justify-center gap-3 bg-black text-white px-12 py-5 rounded-[1.5rem] text-[0.7rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-black/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none overflow-hidden"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                Initializing...
              </>
            ) : (
              <>
                Initialize Units <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkVariantModal;
