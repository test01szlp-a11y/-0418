/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  PieChart, 
  Bell, 
  Settings, 
  Search, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Send,
  Upload,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Video,
  Loader2,
  MoreVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateBotResponse } from './services/gemini';
import type { Customer, Message, BusinessStatus, TaxData } from './types';

// Mock Data
const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: '智点科技有限公司', industry: '互联网/广告', contact: '张三', status: 'wait_info', progress: 10, docsReceived: { invoice: false, bank: false, salary: false }, lastMessage: '我想开个票' },
  { id: '2', name: '丰收餐饮管理公司', industry: '餐饮/零售', contact: '李四', status: 'collecting', progress: 45, docsReceived: { invoice: true, bank: false, salary: true }, lastMessage: '流水还没拉出来' },
  { id: '3', name: '蓝图建筑工程中心', industry: '工程/设计', contact: '王五', status: 'calculating', progress: 75, docsReceived: { invoice: true, bank: true, salary: true }, lastMessage: '这月税大概多少？' },
];

const INITIAL_MESSAGES: Message[] = [
  { id: '1', sender: 'customer', senderName: '张三@智点科技', content: 'AccoBot，我们要开张票，3500块钱的咨询费。', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '2', sender: 'bot', senderName: 'AccoBot', content: '好的，请提供您的开票信息（购方名称、税号、地址等），我将立即为您处理。', timestamp: new Date(Date.now() - 1000 * 60 * 29) },
];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'chat' | 'docs' | 'tax'>('dashboard');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [videoStatus, setVideoStatus] = useState<{ status: 'idle' | 'generating' | 'ready', type: 'summary' | 'demo' }>({ status: 'idle', type: 'summary' });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'customer',
      senderName: '客户',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsBotTyping(true);

    const botReply = await generateBotResponse(inputText, `正在处理 ${activeCustomer?.name || '一个新客户'} 的请求。`);
    
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      senderName: 'AccoBot',
      content: botReply,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMsg]);
    setIsBotTyping(false);
  };

  const getStatusColor = (status: BusinessStatus) => {
    switch(status) {
      case 'wait_info': return 'text-[#F59E0B] bg-[#FFFBEB] border-[#FEF3C7]';
      case 'invoicing': return 'text-[#2563EB] bg-[#EFF6FF] border-[#DBEAFE]';
      case 'collecting': return 'text-[#7C3AED] bg-[#F5F3FF] border-[#EDE9FE]';
      case 'calculating': return 'text-[#2563EB] bg-[#EFF6FF] border-[#DBEAFE]';
      case 'filing': return 'text-[#F59E0B] bg-[#FFFBEB] border-[#FEF3C7]';
      case 'paid': return 'text-[#10B981] bg-[#D1FAE5] border-[#A7F3D0]';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: BusinessStatus) => {
    const map: Record<BusinessStatus, string> = {
      wait_info: '待提供信息',
      invoicing: '开票处理中',
      collecting: '资料收集',
      calculating: '税金测算',
      filing: '待申报',
      paid: '已缴纳'
    };
    return map[status];
  };

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const startFullAutoDemo = async () => {
    if (!activeCustomer) return;
    setIsAutoPlaying(true);
    setMessages([]);
    
    const steps = [
      // 场景 1: 开票
      { sender: 'customer', name: activeCustomer.contact, text: `AccoBot，帮我开一张 ${activeCustomer.name} 的 5000 元设计费发票。` },
      { sender: 'bot', name: 'AccoBot', text: '收到！正在调取您的公司开票抬头... 确认无误，发票已自动开具并发送至您的邮箱。' },
      
      // 场景 2: 资料催收
      { sender: 'bot', name: 'AccoBot', text: '顺便提醒一下，本月的银行对账单和工资表还没上传。请问现在方便提供吗？' },
      { sender: 'customer', name: activeCustomer.contact, text: '好的，刚才已经补充上传了，你检查一下。' },
      { sender: 'bot', name: 'AccoBot', text: '收到！系统已自动对上传的图片进行识别、分类并归档。目前资料收集完整度：100%。' },
      
      // 场景 3: 税金测算
      { sender: 'customer', name: activeCustomer.contact, text: '资料全了，那帮我算一下这月的税大概多少？' },
      { sender: 'bot', name: 'AccoBot', text: '正在基于本月已识别的进项与销项数据进行精算... 计算完成。本月预计应缴增值税：¥1,240.50。' },
      { sender: 'bot', name: 'AccoBot', text: '您可以点击顶部“生成经营周报”获取详细的可视化分析。' },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 2000));
      
      // 模拟业务逻辑对状态的影响
      if (i === 2) { // 资料催收开始
        setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'collecting' } : c));
      }
      if (i === 5) { // 资料收集完成
        setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, docsReceived: { invoice: true, bank: true, salary: true }, progress: 65 } : c));
      }
      if (i === 7) { // 税金测算完成
        setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'calculating', progress: 90 } : c));
      }

      const msg: Message = {
        id: Date.now().toString() + Math.random(),
        sender: step.sender as any,
        senderName: step.name,
        content: step.text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, msg]);
      if (step.sender === 'customer') {
        setIsBotTyping(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsBotTyping(false);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsAutoPlaying(false);
    handleGenVideo('demo');
  };

  const handleGenVideo = (type: 'summary' | 'demo') => {
    setVideoStatus({ status: 'generating', type });
    setTimeout(() => {
      setVideoStatus({ status: 'ready', type });
    }, 5000);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-[#1E293B] overflow-hidden">
      {/* Sidebar */}
      <nav className="w-20 lg:w-64 bg-white border-r border-[#E2E8F0] flex flex-col items-center lg:items-stretch py-6 px-4">
        <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden">
          <div className="w-8 h-8 bg-[#2563EB] rounded-[6px] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <span className="font-extrabold text-[18px] hidden lg:block tracking-tight text-[#1E293B]">智账数字员工</span>
        </div>

        <div className="flex-1 space-y-1">
          <NavItem icon={<Users size={20} />} label="客户大厅" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={<MessageSquare size={20} />} label="协作会话" active={view === 'chat'} onClick={() => setView('chat')} />
          <NavItem icon={<FileText size={20} />} label="资料中心" active={view === 'docs'} onClick={() => setView('docs')} />
          <NavItem icon={<PieChart size={20} />} label="税金分析" active={view === 'tax'} onClick={() => setView('tax')} />
        </div>

        <div className="pt-6 border-t border-slate-100">
          <NavItem icon={<Settings size={20} />} label="系统设置" active={false} onClick={() => {}} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 max-w-6xl mx-auto"
            >
              <header className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">客户大厅</h1>
                  <p className="text-slate-500 mt-1">管理您所有的服务客户及其业务进度</p>
                </div>
                <button className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2">
                  <span className="text-lg">+</span> 接入新客户
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="待测算税金" value="¥42,800" color="bg-[#F59E0B]" />
                <StatCard label="待确认识别" value="156 份" color="bg-[#2563EB]" />
                <StatCard label="本月已申报" value="82.4%" color="bg-[#10B981]" />
                <StatCard label="活跃群聊" value="42 个" color="bg-[#7C3AED]" />
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <div className="p-5 border-bottom border-[#E2E8F0] flex items-center justify-between">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                    <input 
                      type="text" 
                      placeholder="搜索客户名称或联系人..." 
                      className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border-none rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
                
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-y border-slate-100">
                    <tr>
                      <th className="px-6 py-4">公司名称</th>
                      <th className="px-6 py-4">联系人</th>
                      <th className="px-6 py-4">业务状态</th>
                      <th className="px-6 py-4">进度</th>
                      <th className="px-6 py-4">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setActiveCustomer(c); setView('chat'); }}>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-400">{c.industry}</div>
                        </td>
                        <td className="px-6 py-5 text-sm">{c.contact}</td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                            {getStatusText(c.status)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{c.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            处理 <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full"
            >
              {/* Chat Sidebar */}
              <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold">企微群聊</h2>
                  <p className="text-xs text-slate-400 mt-1">代账数字员工 AccoBot 正为您值守</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {customers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setActiveCustomer(c)}
                      className={`p-4 cursor-pointer border-b border-[#E2E8F0] transition-colors ${activeCustomer?.id === c.id ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-semibold text-sm truncate ${activeCustomer?.id === c.id ? 'text-[#2563EB]' : 'text-[#1E293B]'}`}>{c.name} 运营群</span>
                        <span className="text-[10px] text-[#64748B]">10:24</span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate">{c.lastMessage || '暂无对话'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col bg-[#F3F5F7]">
                {activeCustomer ? (
                  <>
                    <header className="p-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {activeCustomer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{activeCustomer.name} 财务协作群</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            数字员工 AccoBot 在线中
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {!isAutoPlaying && (
                          <button 
                            onClick={startFullAutoDemo}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                          >
                            <ArrowRight size={14} className="animate-pulse" /> 全自动流程演示
                          </button>
                        )}
                        <button 
                          onClick={() => handleGenVideo('demo')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] text-[#2563EB] rounded-lg text-xs font-bold hover:bg-[#E2E8F0] transition-colors border border-[#DBEAFE]"
                        >
                          <Video size={14} /> 生成演示
                        </button>
                        <button 
                          onClick={() => handleGenVideo('summary')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                        >
                          <TrendingUp size={14} /> 生成经营周报
                        </button>
                        <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
                      </div>
                    </header>

                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      {messages.map((m, idx) => (
                        <div key={idx} className={`flex ${m.sender === 'bot' ? 'justify-start' : 'justify-end'} group`}>
                          {m.sender === 'bot' && (
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex-shrink-0 mr-3 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-100">
                              A
                            </div>
                          )}
                          <div className={`max-w-[70%] ${m.sender === 'bot' ? 'bg-white rounded-tr-2xl rounded-br-2xl rounded-bl-2xl shadow-sm border border-[#E2E8F0]' : 'bg-[#2563EB] text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-md'} p-4 text-sm relative`}>
                            <div className={`text-[10px] mb-1 font-bold ${m.sender === 'bot' ? 'text-[#2563EB]' : 'text-blue-100'}`}>
                              {m.senderName}
                            </div>
                            <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                            <div className={`text-[10px] mt-2 text-right ${m.sender === 'bot' ? 'text-[#64748B]' : 'text-blue-100 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                              {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isBotTyping && (
                        <div className="flex justify-start">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex-shrink-0 mr-3 flex items-center justify-center text-white font-bold text-xs">
                            A
                          </div>
                          <div className="bg-white rounded-tr-xl rounded-br-xl rounded-bl-xl p-4 shadow-sm">
                            <div className="flex gap-1">
                              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></motion.span>
                              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></motion.span>
                              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></motion.span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef}></div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={isAutoPlaying ? "正在演示自动化流程..." : "给客户回复或发出指令..."}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          disabled={isAutoPlaying}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3"
                        />
                        <button 
                          onClick={handleSendMessage}
                          className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                      <div className="flex gap-3 mt-3 px-1">
                        <QuickAction label="代开票" onClick={() => setInputText('正在为您自动生成发票...')} />
                        <QuickAction label="催收资料" onClick={() => setInputText('本月会计资料（银行流水、发票、工资表）记得上传哦')} />
                        <QuickAction label="发送税金确认" onClick={() => setInputText('测算结果已出：本月预计交增值税 452.12 元，请查收')} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-sm">请选择一个客户会话开始协作</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'docs' && (
            <motion.div 
              key="docs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 max-w-6xl mx-auto"
            >
              <h1 className="text-3xl font-bold mb-8">资料中心</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {customers.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
                    <div className="flex justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-lg">{c.name}</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-tighter">本月资料收集中</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-600">{(Object.values(c.docsReceived).filter(Boolean).length / 3 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <DocItem label="发票(销项/进项)" received={c.docsReceived.invoice} />
                      <DocItem label="银行对账单/流水" received={c.docsReceived.bank} />
                      <DocItem label="员工工资表/社保" received={c.docsReceived.salary} />
                    </div>

                    <button className="mt-6 w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                      <Upload size={16} /> 补充上传
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'tax' && (
            <motion.div 
              key="tax"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 max-w-4xl mx-auto"
            >
              <h1 className="text-3xl font-bold mb-8 text-center" id="tax_analysis_title">税金测算与申报</h1>
              <div className="space-y-6">
                {customers.filter(c => c.status === 'calculating' || c.status === 'filing').map(c => (
                  <TaxCard key={c.id} customer={c} />
                ))}
                {customers.filter(c => c.status !== 'calculating' && c.status !== 'filing').length > 0 && (
                   <div className="text-center p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                     <p className="text-sm">其他客户尚未进入税金环节</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Generation Modal */}
        <AnimatePresence>
          {videoStatus.status !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl relative"
              >
                <button 
                  onClick={() => setVideoStatus({ status: 'idle', type: 'summary' })}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <X />
                </button>
                
                {videoStatus.status === 'generating' ? (
                  <div className="py-10">
                    <Loader2 className="w-16 h-16 text-[#2563EB] animate-spin mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-2">
                      {videoStatus.type === 'demo' ? '正在渲染企微群互动演示' : '正在为您生成 AI 商业周报'}
                    </h2>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
                      <LoadingStep label={`正在分析 ${activeCustomer?.name} 财务数据...`} active={true} />
                      <LoadingStep label="正在聚合本周沟通内容..." active={true} />
                      <LoadingStep label="Veo 引擎正在渲染数字视频..." active={true} />
                    </div>
                  </div>
                ) : (
                  <div className="py-6">
                    <div className={`${videoStatus.type === 'demo' ? 'aspect-[9/16] max-h-[60vh] mx-auto' : 'aspect-video'} bg-slate-900 rounded-2xl mb-6 relative group overflow-hidden border border-slate-800 shadow-inner`}>
                      <video 
                        className="w-full h-full object-cover opacity-80"
                        autoPlay
                        loop
                        muted
                        playsInline
                        src="https://www.w3schools.com/html/mov_bbb.mp4" 
                      ></video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all cursor-pointer">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#2563EB] shadow-xl">
                          <ArrowRight size={32} />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-left">
                        <p className="text-white font-bold text-lg drop-shadow-md">
                          {videoStatus.type === 'demo' ? `微信互动演示 - ${activeCustomer?.name}` : `经营分析报告 - ${activeCustomer?.name}`}
                        </p>
                        <p className="text-white/70 text-[10px] tracking-widest uppercase">Generated by AI Studio Veo Engine</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button className="flex-1 py-4 bg-[#2563EB] text-white rounded-2xl font-bold hover:bg-blue-700 transition-all">确认并发送至群</button>
                      <button className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200" onClick={() => setVideoStatus({ status: 'idle', type: 'summary' })}>关闭</button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, key?: React.Key }) {
  return (
    <button 
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 group border-l-[3px] ${active ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] font-bold' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#2563EB] border-transparent'}`}
    >
      <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
      <span className={`text-sm whitespace-nowrap hidden lg:block`}>{label}</span>
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm relative overflow-hidden group">
      <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-[#1E293B] tracking-tight">{value}</p>
      <div className={`absolute bottom-0 left-0 h-1 ${color} w-0 group-hover:w-full transition-all duration-300`}></div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-colors"
    >
      {label}
    </button>
  );
}

function DocItem({ label, received }: { label: string, received: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#2563EB]/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${received ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
          <FileText size={16} />
        </div>
        <span className="text-sm font-medium text-[#1E293B]">{label}</span>
      </div>
      {received ? (
        <span className="px-2 py-0.5 bg-[#D1FAE5] text-[#065F46] text-[10px] font-bold rounded uppercase">已归档</span>
      ) : (
        <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded uppercase">待补齐</span>
      )}
    </div>
  );
}

function TaxCard({ customer }: { customer: Customer, key?: React.Key }) {
  const [data] = useState<TaxData>({
    sales: 120500,
    purchases: 45000,
    vatRate: 0.06,
    estimatedVat: 4530,
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
        <div>
          <h3 className="text-lg font-bold text-[#1E293B]">{customer.name}</h3>
          <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-0.5">2026年3月 税金预研报告</p>
        </div>
        <div className={`px-3 py-1 rounded text-[11px] font-bold uppercase ${customer.status === 'filing' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
          {customer.status === 'filing' ? '待申报' : '测算中'}
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#64748B]">销项总额 (含税)</span>
            <span className="font-mono font-bold text-sm">¥{data.sales.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-[#10B981]">
            <span className="text-sm">已认证进项 (含税)</span>
            <span className="font-mono font-bold text-sm">- ¥{data.purchases.toLocaleString()}</span>
          </div>
          <div className="h-px bg-[#E2E8F0]"></div>
          <div className="flex justify-between items-center">
            <span className="text-[#1E293B] font-bold">应纳增值税</span>
            <span className="font-mono font-bold text-xl text-[#2563EB]">¥{data.estimatedVat.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <button className="w-full py-3 bg-[#2563EB] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm">
            <Send size={16} /> 发给客户确认
          </button>
          <button className="w-full py-3 bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#F1F5F9] transition-all">
            <CheckCircle2 size={16} /> 生成申报凭证
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`flex items-center gap-3 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
