import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, QrCode, CheckCircle, ChevronLeft, Search, Droplet, Star, Package, MapPin, User, Home, Send, Loader, RefreshCw, AlertCircle, Sparkles, Share2, Copy, Lock, Store, Instagram, Info } from 'lucide-react';

export default function App() {
  const API_URL = "http://127.0.0.1:8000/api"; 

  // --- CONFIGURAÇÃO VISUAL (DARK PREMIUM) ---
  // Fundo escuro com gradiente suave
  const darkBackground = {
    background: `
      radial-gradient(circle at 50% -20%, rgba(107, 33, 168, 0.15) 0%, transparent 60%),
      linear-gradient(180deg, #111827 0%, #030712 100%)
    `,
    minHeight: '100vh',
    color: 'white',
    backgroundAttachment: 'fixed',
  };

  // Estilos de Vidro (Glassmorphism)
  const glassCard = "bg-gray-800/40 backdrop-blur-md border border-white/5 shadow-xl";
  const darkInput = "w-full p-4 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-white/30 outline-none transition-all";

  // --- ESTADOS ---
  const [storeSlug, setStoreSlug] = useState(null); 
  const [storeData, setStoreData] = useState(null); 
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('menu'); 
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pixData, setPixData] = useState(null); 
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [customer, setCustomer] = useState({ name: '', phone: '', street: '', number: '', neighborhood: '', complement: '', reference: '' });

  // --- CORES & DADOS DINÂMICOS ---
  const primaryColor = storeData?.cor_primaria || "#6b21a8"; 
  const secondaryColor = storeData?.cor_secundaria || "#4c1d95";
  const whatsappNumber = storeData?.telefone_whatsapp || "5521999999999";
  const storeName = storeData?.nome || "Seu App Delivery";
  
  // Novos campos que vêm do Django
  const storeDesc = storeData?.descricao;
  const storeAddress = storeData?.endereco;
  const storeInsta = storeData?.instagram;

  // --- LÓGICA ---
  useEffect(() => {
    const hash = window.location.hash.replace('#/', '');
    if (hash) {
      setStoreSlug(hash);
      fetchStoreData(hash);
    } else {
      setLoading(false);
    }
    window.addEventListener('hashchange', () => window.location.reload());
  }, []);

  const fetchStoreData = async (slug) => {
    setLoading(true);
    try {
      const storeRes = await fetch(`${API_URL}/lojas/${slug}/`);
      if (!storeRes.ok) throw new Error('Loja não encontrada');
      const storeInfo = await storeRes.json();
      setStoreData(storeInfo);

      const catRes = await fetch(`${API_URL}/categorias/?loja=${slug}`);
      const catData = await catRes.json();
      setCategories([{ id: 'Todos', nome: 'Todos' }, ...catData]);

      const prodRes = await fetch(`${API_URL}/produtos/?loja=${slug}`);
      const prodData = await prodRes.json();
      
      const formattedProducts = prodData.map(item => ({
        id: item.id,
        name: item.nome,
        description: item.descricao || "",
        price: parseFloat(item.preco),
        category: item.categoria_nome,
        image: item.imagem || "https://placehold.co/400?text=Sem+Foto"
      }));
      setProducts(formattedProducts);

    } catch (error) {
      setStoreData(null); 
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => setCart(prev => {
    const exist = prev.find(i => i.id === item.id);
    return exist ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1 }];
  });
  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id, change) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item));
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const openWhatsApp = () => {
    let msg = `*PEDIDO - ${storeName.toUpperCase()}* ✅\n\n`;
    msg += `*Cliente:* ${customer.name}\n`;
    let statusPagamento = paymentMethod === 'pix' && paymentStatus === 'approved' ? "✅ PIX PAGO" : "Cartão/Dinheiro";
    msg += `*Itens:* ${cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}\n`;
    msg += `*Total:* R$ ${cartTotal.toFixed(2)}\n`;
    msg += `*Pagamento:* ${statusPagamento}\n`;
    msg += `*Endereço:* ${customer.street}, ${customer.number} - ${customer.neighborhood}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredItems = products.filter(i => (activeCategory === 'Todos' || i.category === activeCategory) && i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleInputChange = (e) => setCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreatePix = async () => {
    setIsCreatingPix(true);
    setPaymentStatus('pending');
    try {
      const response = await fetch(`${API_URL}/criar-pix/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: cartTotal,
          nome: customer.name,
          email: "cliente@email.com"
        })
      });
      const data = await response.json();
      if (data.qr_code) {
        setPixData(data);
        setCheckoutStep('pix_display');
      } else { alert("Erro ao gerar Pix."); }
    } catch (error) { alert("Erro de conexão."); } finally { setIsCreatingPix(false); }
  };

  const copyPix = () => {
    if (pixData) { navigator.clipboard.writeText(pixData.qr_code); alert("Copiado!"); }
  };

  useEffect(() => {
    let interval;
    if (checkoutStep === 'pix_display' && pixData?.id) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/verificar-pagamento/${pixData.id}/`);
          const data = await res.json();
          if (data.status === 'approved') {
            setPaymentStatus('approved');
            setCheckoutStep('success'); 
            clearInterval(interval);
          }
        } catch (error) {}
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [checkoutStep, pixData]);

  // --- RENDERIZAÇÃO ---

  // HOME (SaaS)
  if (!storeSlug) {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center" style={darkBackground}>
            <div className={`${glassCard} p-10 rounded-[40px] max-w-md w-full`}>
                <div className="bg-gradient-to-tr from-purple-700 to-indigo-800 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-12 border border-white/10">
                    <Store size={48} className="text-white" />
                </div>
                <h1 className="text-4xl font-black mb-2 tracking-tighter text-white">SaaS<span className="text-purple-400">App</span></h1>
                <p className="text-gray-400 mb-8 font-medium">Plataforma Multi-loja Premium</p>
                <div className="space-y-4">
                    <a href="#/acai-gui" className="block bg-gray-800 hover:bg-gray-700 border border-gray-600 p-4 rounded-xl transition-all flex justify-between items-center group">
                        <span className="font-bold text-white group-hover:text-purple-400">Açaí do Gui</span>
                        <ChevronLeft className="rotate-180 text-gray-500 group-hover:text-white"/>
                    </a>
                    <a href="#/sushi-top" className="block bg-gray-800 hover:bg-gray-700 border border-gray-600 p-4 rounded-xl transition-all flex justify-between items-center group">
                        <span className="font-bold text-white group-hover:text-red-400">Sushi Top</span>
                        <ChevronLeft className="rotate-180 text-gray-500 group-hover:text-white"/>
                    </a>
                </div>
            </div>
        </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={darkBackground}><Loader className="animate-spin text-white" /></div>;

  if (!storeData) return <div className="min-h-screen flex items-center justify-center text-white" style={darkBackground}>Loja não encontrada</div>;

  // MENU DA LOJA
  if (checkoutStep === 'menu') {
    return (
      <div className="font-sans transition-colors duration-500 pb-24" style={darkBackground}>
        
        {/* Header Transparente com NOVOS DADOS */}
        <header className="pt-8 pb-6 px-6 sticky top-0 z-20 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all" style={{background: `linear-gradient(to right, ${primaryColor}CC, ${secondaryColor}CC)`}}>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-black text-white flex gap-2 drop-shadow-md tracking-tight leading-none">{storeName}</h1>
                
                {/* DESCRIÇÃO DA LOJA */}
                {storeDesc && (
                    <p className="text-white/80 text-sm mt-2 font-medium leading-relaxed max-w-md">{storeDesc}</p>
                )}

                {/* INFO EXTRA (Endereço e Insta) */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                        <p className="text-white text-xs font-bold uppercase tracking-wider">Aberto</p>
                    </div>

                    {storeAddress && (
                        <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-white/90 text-xs font-medium">
                            <MapPin size={12} className="text-gray-300"/> {storeAddress}
                        </div>
                    )}

                    {storeInsta && (
                        <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-white/90 text-xs font-medium cursor-pointer hover:bg-white/10 transition">
                            <Instagram size={12} className="text-pink-400"/> {storeInsta}
                        </div>
                    )}
                </div>
              </div>
              
              <div className="relative cursor-pointer group" onClick={() => {setIsCartOpen(true); setCheckoutStep('cart')}}>
                 <div className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">
                    <ShoppingCart size={24} className="text-white"/>
                 </div>
                 {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center text-gray-900 border-2 border-transparent">{cartCount}</span>}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 max-w-4xl mx-auto">
            {/* Busca Dark */}
            <div className="relative mb-8 mt-4 group">
                <Search className="absolute left-4 top-4 text-gray-500 group-focus-within:text-white transition-colors" size={20}/>
                <input 
                    type="text" 
                    placeholder="Pesquisar no cardápio..." 
                    className={darkInput + " pl-12 font-bold"}
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>

            {/* Categorias Dark */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-4">
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.nome)} 
                        className={`px-5 py-2.5 rounded-xl whitespace-nowrap font-bold transition-all border ${
                            activeCategory === cat.nome 
                            ? 'text-white border-transparent shadow-[0_0_15px_rgba(0,0,0,0.5)] transform scale-105' 
                            : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700'
                        }`}
                        style={activeCategory === cat.nome ? {backgroundColor: primaryColor} : {}}
                    >
                        {cat.nome}
                    </button>
                ))}
            </div>

            {/* Grid de Produtos Dark */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredItems.map(item => (
                    <div key={item.id} className={`${glassCard} p-4 rounded-3xl flex gap-4 hover:bg-gray-800/60 transition-all duration-300 group`}>
                        <div className="w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-900 shadow-lg border border-white/5">
                            <img src={item.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"/>
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight mb-1">{item.name}</h3>
                                <p className="text-xs text-gray-400 font-medium line-clamp-2">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="font-black text-xl text-gray-100">R$ {item.price.toFixed(2)}</span>
                                <button 
                                    onClick={() => addToCart(item)} 
                                    className="p-2.5 rounded-xl shadow-lg active:scale-90 transition-all text-white hover:brightness-110"
                                    style={{backgroundColor: primaryColor}}
                                >
                                    <Plus size={20} strokeWidth={3}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Barra Flutuante Neon */}
        {cartCount > 0 && (
            <div className="fixed bottom-6 left-4 right-4 z-30 max-w-4xl mx-auto">
                <button 
                    onClick={() => setCheckoutStep('cart')} 
                    className="w-full text-white p-1 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:scale-[1.02] border border-white/20"
                    style={{background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`}}
                >
                    <div className="bg-black/30 p-4 rounded-xl flex justify-between items-center border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg"><ShoppingCart size={20}/></div>
                            <span className="text-sm font-bold uppercase tracking-widest text-gray-300">Ver Sacola</span>
                        </div>
                        <span className="text-xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                </button>
            </div>
        )}
      </div>
    );
  }

  // --- TELAS SECUNDÁRIAS (Dark Mode) ---
  if (['cart', 'address', 'payment', 'pix_display', 'success'].includes(checkoutStep)) {
      return (
          <div className="min-h-screen p-6 font-sans flex flex-col items-center" style={darkBackground}>
              <div className="w-full max-w-lg">
                  <button onClick={() => setCheckoutStep('menu')} className="mb-8 flex items-center gap-2 font-bold text-gray-400 hover:text-white transition bg-gray-800/50 w-max px-4 py-2 rounded-full border border-gray-700"><ChevronLeft/> Voltar</button>
                  
                  <div className={`${glassCard} p-8 rounded-[30px]`}>
                      <h2 className="text-2xl font-black text-white mb-8 border-b border-white/10 pb-4">
                          {checkoutStep === 'cart' ? 'Sua Sacola' : checkoutStep === 'address' ? 'Entrega' : 'Pagamento'}
                      </h2>

                      {checkoutStep === 'cart' && (
                          <div className="space-y-4">
                              {cart.length === 0 ? <p className="text-center text-gray-500 py-10 font-bold">Carrinho vazio</p> : cart.map(item => (
                                  <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0">
                                      <div><p className="font-bold text-white">{item.name}</p><p className="text-gray-400 text-sm">R$ {item.price.toFixed(2)}</p></div>
                                      <div className="flex items-center gap-3 bg-gray-900/50 p-1 rounded-lg border border-white/5">
                                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 rounded-md text-gray-400 hover:text-white"><Minus size={14}/></button>
                                          <span className="font-bold w-4 text-center text-white">{item.quantity}</span>
                                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2 rounded-md text-white shadow-sm" style={{backgroundColor: primaryColor}}><Plus size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                              {cart.length > 0 && <button onClick={() => setCheckoutStep('address')} className="w-full text-white p-4 rounded-xl font-bold shadow-lg mt-6 hover:brightness-110 transition" style={{backgroundColor: primaryColor}}>Continuar</button>}
                          </div>
                      )}

                      {checkoutStep === 'address' && (
                          <div className="space-y-3">
                              <input name="name" placeholder="Nome" value={customer.name} onChange={handleInputChange} className={darkInput} />
                              <input name="phone" placeholder="WhatsApp" value={customer.phone} onChange={handleInputChange} className={darkInput} />
                              <div className="h-px bg-white/10 my-2"></div>
                              <input name="street" placeholder="Rua" value={customer.street} onChange={handleInputChange} className={darkInput} />
                              <div className="flex gap-3"><input name="number" placeholder="Nº" value={customer.number} onChange={handleInputChange} className={`w-1/3 ${darkInput}`} /><input name="neighborhood" placeholder="Bairro" value={customer.neighborhood} onChange={handleInputChange} className={`w-2/3 ${darkInput}`} /></div>
                              <button disabled={!customer.name || !customer.street} onClick={() => setCheckoutStep('payment')} className="w-full text-white p-4 rounded-xl font-bold shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition" style={{backgroundColor: primaryColor}}>Ir para Pagamento</button>
                          </div>
                      )}

                      {checkoutStep === 'payment' && (
                          <div className="space-y-4">
                              <div className="bg-gray-800/50 p-6 rounded-2xl text-center mb-6 border border-white/5">
                                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total a Pagar</p>
                                  <p className="text-4xl font-black text-white">R$ {cartTotal.toFixed(2)}</p>
                              </div>
                              <button onClick={() => setPaymentMethod('pix')} className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${paymentMethod === 'pix' ? 'border-green-500 bg-green-500/10 text-white' : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800'}`}><QrCode className={paymentMethod === 'pix' ? "text-green-400" : "text-gray-500"}/><span className="font-bold">Pix</span></button>
                              <button onClick={() => setPaymentMethod('card')} className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${paymentMethod === 'card' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800'}`}><CreditCard className={paymentMethod === 'card' ? "text-purple-400" : "text-gray-500"}/><span className="font-bold">Cartão</span></button>
                              <button onClick={() => paymentMethod === 'pix' ? handleCreatePix() : setCheckoutStep('success')} disabled={!paymentMethod || isCreatingPix} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold mt-4 shadow-lg hover:bg-green-500 transition disabled:opacity-50">{isCreatingPix ? <Loader className="animate-spin mx-auto"/> : (paymentMethod === 'pix' ? 'Gerar Pix' : 'Finalizar')}</button>
                          </div>
                      )}

                      {checkoutStep === 'pix_display' && pixData && (
                          <div className="text-center">
                              <div className="bg-white p-4 rounded-2xl inline-block mb-6 relative">
                                  <img src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} className="w-64 h-64 object-contain mx-auto"/>
                              </div>
                              <div className="flex items-center justify-center gap-2 mb-6 bg-gray-800 px-4 py-2 rounded-full w-max mx-auto border border-gray-700">
                                  <RefreshCw size={14} className="animate-spin text-blue-400"/>
                                  <span className="text-xs font-bold text-gray-300 uppercase">Aguardando...</span>
                              </div>
                              <button onClick={copyPix} className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition"><Copy size={20}/> Copiar Código</button>
                          </div>
                      )}

                      {checkoutStep === 'success' && (
                          <div className="text-center py-6">
                              <div className="bg-green-500/20 text-green-400 p-6 rounded-full inline-block mb-6"><CheckCircle size={64}/></div>
                              <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
                              <button onClick={openWhatsApp} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold shadow-lg mt-6 hover:bg-green-500 transition flex items-center justify-center gap-2"><Send size={20}/> WhatsApp</button>
                              <button onClick={() => { setCart([]); setCheckoutStep('menu'); setPaymentMethod(null); setPixData(null); }} className="mt-6 text-gray-500 hover:text-white transition text-sm">Voltar</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  return null;
}