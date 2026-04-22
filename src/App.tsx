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
  Activity,
  CreditCard,
  Video,
  Loader2,
  MoreVertical,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateBotResponse } from './services/gemini';
import type { Customer, Message, BusinessStatus, TaxData } from './types';

// Mock Data
const BOT_AVATAR = 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=200&h=200&fit=crop&q=80';

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: '智点科技有限公司', industry: '互联网/广告', contact: '张总', status: 'wait_info', progress: 10, docsReceived: { invoice: false, bank: false, salary: false }, lastMessage: '我想开个票', avatar: 'https://picsum.photos/seed/zhangsan/100/100' },
  { id: '2', name: '丰收餐饮管理公司', industry: '餐饮/零售', contact: '李四', status: 'collecting', progress: 45, docsReceived: { invoice: true, bank: false, salary: true }, lastMessage: '流水还没拉出来', avatar: 'https://picsum.photos/seed/lisi/100/100' },
  { id: '3', name: '蓝图建筑工程中心', industry: '工程/设计', contact: '王五', status: 'calculating', progress: 75, docsReceived: { invoice: true, bank: true, salary: true }, lastMessage: '这月税大概多少？', avatar: 'https://picsum.photos/seed/wangwu/100/100' },
  { id: '4', name: '盛大物流运输专线', industry: '物流/运输', contact: '刘工', status: 'filing', progress: 90, docsReceived: { invoice: true, bank: true, salary: true }, avatar: 'https://picsum.photos/seed/logistics/100/100' },
  { id: '5', name: '悦享优选商贸有限公司', industry: '电商/商贸', contact: '陈经理', status: 'paid', progress: 100, docsReceived: { invoice: true, bank: true, salary: true }, avatar: 'https://picsum.photos/seed/trade/100/100' },
  { id: '6', name: '顶峰装饰设计工作室', industry: '建筑/装饰', contact: '周工', status: 'manual', progress: 65, docsReceived: { invoice: true, bank: false, salary: true }, avatar: 'https://picsum.photos/seed/design/100/100' },
  { id: '7', name: '恒生医药连锁有限公司', industry: '医疗/医药', contact: '赵总', status: 'collecting', progress: 30, docsReceived: { invoice: false, bank: true, salary: false }, avatar: 'https://picsum.photos/seed/medical/100/100' },
  { id: '8', name: '天行教育培训中心', industry: '教育/培训', contact: '孙老师', status: 'calculating', progress: 80, docsReceived: { invoice: true, bank: true, salary: true }, avatar: 'https://picsum.photos/seed/edu/100/100' },
  { id: '9', name: '绿洲园林绿化公司', industry: '园林/环境', contact: '林经理', status: 'wait_info', progress: 5, docsReceived: { invoice: false, bank: false, salary: false }, avatar: 'https://picsum.photos/seed/garden/100/100' },
  { id: '10', name: '金色年华咨询服务', industry: '专业服务/咨询', contact: '郑总', status: 'filing', progress: 95, docsReceived: { invoice: true, bank: true, salary: true }, avatar: 'https://picsum.photos/seed/consult/100/100' },
  { id: '11', name: '迅捷电子五金厂', industry: '制造/硬件', contact: '黄厂长', status: 'paid', progress: 100, docsReceived: { invoice: true, bank: true, salary: true }, avatar: 'https://picsum.photos/seed/factory/100/100' },
  { id: '12', name: '极味坊食品贸易', industry: '食品/贸易', contact: '吴总', status: 'collecting', progress: 50, docsReceived: { invoice: true, bank: true, salary: false }, avatar: 'https://picsum.photos/seed/food/100/100' },
];

const INITIAL_MESSAGES: Message[] = [
  { id: '1', sender: 'customer', senderName: '张总@智点科技', content: 'AccoBot，我们要开张票，3500块钱的咨询费。', timestamp: new Date(Date.now() - 1000 * 60 * 30), avatar: 'https://picsum.photos/seed/zhangsan/100/100' },
  { id: '2', sender: 'bot', senderName: 'AccoBot', content: '好的，系统查询到您本月开票额度还剩 5000.00 元。请提供您的开票信息：购方名称、开票商品、金额信息。', timestamp: new Date(Date.now() - 1000 * 60 * 29), avatar: BOT_AVATAR },
];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'chat' | 'docs' | 'tax' | 'workbench' | 'settings'>('workbench');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [workbenchMetrics, setWorkbenchMetrics] = useState({
    completed: 124,
    processing: 32,
    manual: 5
  });
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'manual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
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
      senderName: activeCustomer?.contact || '客户',
      avatar: activeCustomer?.avatar,
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsBotTyping(true);

    const botReplyRaw = await generateBotResponse(inputText, `正在处理 ${activeCustomer?.name || '一个新客户'} 的请求。`);
    const isManualNeeded = botReplyRaw.includes('[SIGNAL_MANUAL_INTERVENTION]');
    const botReply = botReplyRaw.replace('[SIGNAL_MANUAL_INTERVENTION]', '').trim();
    
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      senderName: 'AccoBot',
      avatar: BOT_AVATAR,
      content: botReply,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMsg]);
    setIsBotTyping(false);

    if (isManualNeeded && activeCustomer) {
      setCustomers(prev => prev.map(c => 
        c.id === activeCustomer.id ? { ...c, status: 'manual' } : c
      ));
    }
  };

  const getStatusColor = (status: BusinessStatus) => {
    switch(status) {
      case 'wait_info': return 'text-[#F59E0B] bg-[#FFFBEB] border-[#FEF3C7]';
      case 'invoicing': return 'text-[#2563EB] bg-[#EFF6FF] border-[#DBEAFE]';
      case 'collecting': return 'text-[#7C3AED] bg-[#F5F3FF] border-[#EDE9FE]';
      case 'calculating': return 'text-[#2563EB] bg-[#EFF6FF] border-[#DBEAFE]';
      case 'filing': return 'text-[#F59E0B] bg-[#FFFBEB] border-[#FEF3C7]';
      case 'paid': return 'text-[#10B981] bg-[#D1FAE5] border-[#A7F3D0]';
      case 'manual': return 'text-red-600 bg-red-50 border-red-100';
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
      paid: '已缴纳',
      manual: '需人工介入'
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
      { sender: 'customer', name: activeCustomer.contact, text: 'AccoBot，帮我开张发票。' },
      { sender: 'bot', name: 'AccoBot', text: '好的，系统查询到您本月开票额度还剩 5000.00 元。请提供您的开票需求：【购方名称】、【开票商品】和【金额信息】。' },
      { sender: 'customer', name: activeCustomer.contact, text: `抬头：${activeCustomer.name}\n内容：*设计服务*设计费\n金额：5000元` },
      { sender: 'bot', name: 'AccoBot', text: '已为您提取开票信息：\n- 购方名称：' + activeCustomer.name + '\n- 开票商品：*设计服务*设计费\n- 金额：¥5,000.00\n以上信息确认无误请回复“确认”，我将为您提交开票。' },
      { sender: 'customer', name: activeCustomer.contact, text: '确认无误。' },
      { sender: 'bot', name: 'AccoBot', text: '正在提交系统开票... ✅ 开票成功！增值税电子普通发票已发送至您的预留邮箱，请查收。', isInvoice: true },
      
      // 场景 2: 月底资料催收 (4月25号)
      { sender: 'bot', name: 'AccoBot', text: '【月底提醒】张总您好，今天是 4 月 25 号，系统识别到“智点科技”本月的工资表和银行流水尚未上传。为了不影响下月初的纳税申报，请现在提供一下，好吗？' },
      { sender: 'customer', name: activeCustomer.contact, text: '好的，工资表和流水截图发你，你核对一下。' },
      { sender: 'bot', name: 'AccoBot', text: '收到！系统正在进行 OCR 识别与归档... ✅ 资料已确认并入库。目前所有申报必备资料已收集完毕。' },
      
      // 场景 3: 月初申报确认 (5月1号)
      { sender: 'bot', name: 'AccoBot', text: '【申报提醒】张总早！今天是 5 月 1 号。基于您 4 月份的经营数据，系统精算结果如下：\n- 本月销项税额：1,000.00 元\n- 已认证进项税额：500.00 元\n- 预计应交增值税：500.00 元\n数据确认无误后请回复“确认”，系统将自动为您发起税务申报。' },
      { sender: 'customer', name: activeCustomer.contact, text: '没问题，确认。' },
      { sender: 'bot', name: 'AccoBot', text: '收到指令，系统正在连接电子税务局进行全自动化申报... 🚀 申报已成功提交！税金缴纳通知稍后将通过系统推送给您。' },
      { sender: 'bot', name: 'AccoBot', text: '【缴款提醒】张总，本月应交税金明细已生成，请核对并及时操作扣款：\n- 增值税：500.00 元\n- 印花税：10.00 元\n- 个人所得税：200.00 元\n- 企业所得税：300.00 元\n共计：1,010.00 元。内容核对无误请回复“确认缴款”，我将为您发起支付请求。' },
      { sender: 'customer', name: activeCustomer.contact, text: '确认缴款' },
      { sender: 'bot', name: 'AccoBot', text: '收到，正在连接国库支付系统... ⚙️ 支付请求发送成功，正在等待验证... 🔓 扣款成功！' },
      { 
        sender: 'bot', 
        name: 'AccoBot', 
        text: '张总，这是电子税务局返回的《税收完税证明》（电子版），请查收。本月税务工作已全部圆满完成。',
        image: 'https://images.unsplash.com/photo-1554224155-1696413575b3?w=500&h=350&fit=crop&q=80',
        isReceipt: true
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 2000));
      
      // 模拟业务逻辑对状态的影响
      if (i === 2) setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'invoicing' } : c));
      if (i === 5) setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, docsReceived: { ...c.docsReceived, invoice: true }, progress: 30 } : c));
      if (i === 7) setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'collecting', docsReceived: { invoice: true, bank: true, salary: true }, progress: 70 } : c));
      if (i === 9) setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'calculating', progress: 90 } : c));
      if (i === 11) setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'filing', progress: 100 } : c));
      if (i === 15) setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'paid' } : c));

      const msg: Message = {
        id: Date.now().toString() + Math.random(),
        sender: step.sender as any,
        senderName: step.name,
        avatar: step.sender === 'bot' ? BOT_AVATAR : activeCustomer.avatar,
        content: step.text,
        timestamp: new Date(),
        isInvoice: (step as any).isInvoice,
        image: (step as any).image,
        isReceipt: (step as any).isReceipt
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

  const handleDownloadInvoice = (customerName: string) => {
    // Generate a dummy text blob to simulate an invoice file
    const content = `========== 增值税电子普通发票 ==========\n\n购方名称：${customerName}\n发票代码：0582491\n发票日期：${new Date().toLocaleDateString()}\n\n货物名称：*设计服务*设计费\n合计金额：¥5,000.00\n税率：6%\n税额：¥283.02\n\n========================================`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${customerName}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateSimulationLog = async () => {
    setWorkbenchMetrics(prev => ({
      ...prev,
      processing: prev.processing + 1,
      completed: Math.max(0, prev.completed - 1)
    }));
    await new Promise(r => setTimeout(r, 1500));
    setWorkbenchMetrics(prev => ({
      ...prev,
      processing: Math.max(0, prev.processing - 1),
      completed: prev.completed + 1
    }));
  };

  const startWorkbenchDemo = async () => {
    setIsAutoPlaying(true);
    // Add a manual intervention case during demo if it doesn't exist
    if (customers.length < 4) {
      const manualCustomer: Customer = {
        id: '4',
        name: '火花贸易工作室',
        industry: '电商/进出口',
        contact: '刘总',
        status: 'manual',
        progress: 88,
        docsReceived: { invoice: true, bank: true, salary: true },
        lastMessage: '为什么税金比上月高这么多？',
        avatar: 'https://picsum.photos/seed/huohua/100/100'
      };
      setCustomers(prev => [...prev, manualCustomer]);
    }
    
    for (let i = 0; i < 3; i++) {
      await generateSimulationLog();
    }
    setIsAutoPlaying(false);
  };

  const startDocsDemo = async () => {
    setIsAutoPlaying(true);
    // 1. Identify customers with missing docs
    const targetCustomers = customers.filter(c => !c.docsReceived.invoice || !c.docsReceived.bank || !c.docsReceived.salary);
    
    // 2. High-speed selection simulation
    for (const c of targetCustomers) {
      setSelectedDocIds(prev => [...prev, c.id]);
      await new Promise(r => setTimeout(r, 400));
    }
    
    await new Promise(r => setTimeout(r, 800));
    
    // 3. Trigger processing
    setVideoStatus({ status: 'generating', type: 'demo' });
    await new Promise(r => setTimeout(r, 2000));
    setVideoStatus({ status: 'idle', type: 'demo' });
    
    // 4. Jump to the first one to show the result
    if (targetCustomers.length > 0) {
      const first = targetCustomers[0];
      setActiveCustomer(first);
      setView('chat');
      
      const botMsg: Message = {
        id: Date.now().toString() + Math.random(),
        sender: 'bot',
        senderName: 'AccoBot',
        avatar: BOT_AVATAR,
        content: `【资料催收】${first.contact}您好，系统检测到“${first.name}”本月的资料尚不完整（缺少部分流水/发票），请您核对并尽快在群内上传，谢谢！`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    }
    
    setSelectedDocIds([]);
    setIsAutoPlaying(false);
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
          <NavItem icon={<Users size={20} />} label="客户看板" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={<TrendingUp size={20} />} label="AI 工作台" active={view === 'workbench'} onClick={() => setView('workbench')} />
          <NavItem icon={<MessageSquare size={20} />} label="协作会话" active={view === 'chat'} onClick={() => setView('chat')} />
          <NavItem icon={<FileText size={20} />} label="AI 服务工作台" active={view === 'docs'} onClick={() => setView('docs')} />
          <NavItem icon={<PieChart size={20} />} label="税金分析" active={view === 'tax'} onClick={() => setView('tax')} />
        </div>

        <div className="pt-6 border-t border-slate-100">
          <NavItem icon={<Settings size={20} />} label="系统设置" active={view === 'settings'} onClick={() => setView('settings')} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          {view === 'workbench' && (
            <motion.div 
              key="workbench"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 max-w-6xl mx-auto space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#1E293B]">AI 记账工作台</h1>
                  <p className="text-slate-500 mt-2">数字员工实时记账看板，全链路自动化监控</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={startWorkbenchDemo}
                    disabled={isAutoPlaying}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {isAutoPlaying ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />} 自动化演示
                  </button>
                  <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <Settings size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <WorkbenchCard 
                  title="数字员工已完成" 
                  count={workbenchMetrics.completed} 
                  icon={<CheckCircle2 size={24} className="text-emerald-500" />} 
                  color="emerald" 
                  description="本月已成功申报并划扣税款"
                />
                <WorkbenchCard 
                  title="自动化处理中" 
                  count={workbenchMetrics.processing} 
                  icon={<Loader2 size={24} className="text-blue-500 animate-spin" />} 
                  color="blue" 
                  description="流水同步、OCR识别及精算中"
                />
                <WorkbenchCard 
                  title="需要人工介入" 
                  count={workbenchMetrics.manual} 
                  icon={<Clock size={24} className="text-red-500" />} 
                  color="red" 
                  description="提示：3家企业涉及跨期成本异常"
                  onClick={() => {
                    setDashboardFilter('manual');
                    setView('dashboard');
                  }}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden blur-[0.2px]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Activity size={16} className="text-indigo-600" />
                    数字员工执行流 (Live)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">系统运行正常</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {customers.map((c, idx) => (
                    <motion.div 
                      key={idx} 
                      className="p-4 hover:bg-slate-50 transition-all flex items-center justify-between group"
                      layout
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={c.avatar} className="w-10 h-10 rounded-xl" referrerPolicy="no-referrer" />
                          <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${getStatusColor(c.status)} shadow-sm`}>
                            {c.status === 'paid' ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 tracking-tight">{c.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            {getStatusText(c.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Progress</div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${c.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${c.progress}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-700 tabular-nums">{c.progress}%</div>
                          <button className="text-[9px] font-bold text-indigo-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">查看日志</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

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
                  <h1 className="text-3xl font-bold tracking-tight">
                    {dashboardFilter === 'manual' ? '需人工介入列表' : '客户看板'}
                  </h1>
                  <p className="text-slate-500 mt-1">
                    {dashboardFilter === 'manual' 
                      ? '数字员工无法自动处理，需要财务专家介入支持'
                      : '管理您所有的服务客户及其业务进度'}
                  </p>
                </div>
                {dashboardFilter === 'manual' && (
                  <button 
                    onClick={() => setDashboardFilter('all')}
                    className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
                  >
                    <ArrowRight size={16} className="rotate-180" /> 返回全部客户
                  </button>
                )}
                {dashboardFilter !== 'manual' && (
                  <button className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2">
                    <span className="text-lg">+</span> 接入新客户
                  </button>
                )}
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="待测算税金" value="¥42,800" color="bg-[#F59E0B]" />
                <StatCard label="待确认识别" value="156 份" color="bg-[#2563EB]" />
                <StatCard label="本月已申报" value="82.4%" color="bg-[#10B981]" />
                <StatCard label="活跃群聊" value="42 个" color="bg-[#7C3AED]" />
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <div className="p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setDashboardFilter('all')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      全部客户
                    </button>
                    <button 
                      onClick={() => setDashboardFilter('manual')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${dashboardFilter === 'manual' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      需要人工介入
                      {customers.filter(c => c.status === 'manual').length > 0 && (
                        <span className={`w-2 h-2 rounded-full ${dashboardFilter === 'manual' ? 'bg-red-500' : 'bg-red-400'} animate-pulse`} />
                      )}
                    </button>
                  </div>
                  
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={16} />
                    <input 
                      type="text" 
                      placeholder="搜索客户名称或联系人..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB] transition-all"
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
                      <th className="px-6 py-4 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers
                      .filter(c => {
                        if (dashboardFilter === 'manual') return c.status === 'manual';
                        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                           c.contact.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchesSearch;
                      })
                      .map(c => (
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
                                <div className={`h-full ${c.status === 'manual' ? 'bg-red-400' : 'bg-indigo-500'} rounded-full`} style={{ width: `${c.progress}%` }}></div>
                              </div>
                              <span className="text-xs font-mono text-slate-400">{c.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              {c.status === 'manual' ? (
                                <button className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2 group-hover:scale-105 shadow-sm">
                                  立即介入 <ChevronRight size={14} />
                                </button>
                              ) : (
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  处理 <ChevronRight size={14} />
                                </button>
                              )}
                            </div>
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
                      className={`p-4 cursor-pointer border-b border-[#E2E8F0] transition-colors flex gap-3 ${activeCustomer?.id === c.id ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'}`}
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
                        <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-semibold text-sm truncate ${activeCustomer?.id === c.id ? 'text-[#2563EB]' : 'text-[#1E293B]'}`}>{c.name} 运营群</span>
                          <span className="text-[10px] text-[#64748B] flex-shrink-0 ml-2">10:24</span>
                        </div>
                        <p className="text-xs text-[#64748B] truncate">{c.lastMessage || '暂无对话'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col bg-[#F3F5F7]">
                {activeCustomer ? (
                  <>
                    <header className="p-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shadow-sm relative">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-indigo-100 shadow-sm">
                          <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <div className="font-bold text-sm tracking-tight">{activeCustomer.name} 财务协作群</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            数字员工 AccoBot 在线中
                          </div>
                        </div>
                      </div>
                      {activeCustomer.status === 'manual' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-20 px-6 py-2 bg-red-600 text-white text-xs font-bold rounded-b-xl shadow-xl flex items-center gap-2 border-x border-b border-red-700"
                        >
                          <Bell size={14} className="animate-bounce" />
                          该客户涉及复杂税务规划，已转人工介入处理
                          <button 
                            onClick={() => {
                              setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, status: 'calculating' } : c));
                            }}
                            className="ml-4 px-2 py-0.5 bg-white text-red-600 rounded text-[10px] hover:bg-red-50 transition-colors"
                          >
                            处理完成
                          </button>
                        </motion.div>
                      )}
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
                        <div key={idx} className={`flex ${m.sender === 'bot' ? 'justify-start' : 'justify-end'} group items-start`}>
                          {m.sender === 'bot' && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 mr-3 ring-2 ring-indigo-100 shadow-sm border border-indigo-200">
                              <img src={m.avatar || BOT_AVATAR} alt="Bot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className={`max-w-[70%] ${m.sender === 'bot' ? 'bg-white rounded-tr-2xl rounded-br-2xl rounded-bl-2xl shadow-sm border border-[#E2E8F0]' : 'bg-[#2563EB] text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-md'} p-4 text-sm relative`}>
                            <div className={`text-[10px] mb-1 font-bold ${m.sender === 'bot' ? 'text-[#2563EB]' : 'text-blue-100'}`}>
                              {m.senderName}
                            </div>
                            <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                            {m.image && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
                                <img src={m.image} alt="Attachment" className="w-full h-auto object-cover max-h-60" referrerPolicy="no-referrer" />
                                {m.isReceipt && (
                                  <div className="p-2 bg-slate-50 border-t border-[#E2E8F0] flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-600">税收完税证明.jpg</span>
                                    <button className="text-[10px] text-[#2563EB] font-bold hover:underline">查看原图</button>
                                  </div>
                                )}
                              </div>
                            )}
                            {m.isInvoice && (
                              <div className="mt-3 p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#1E293B]">
                                <div className="flex justify-between items-start border-b border-dashed border-[#E2E8F0] pb-2 mb-2">
                                  <div className="text-[10px] font-bold text-[#2563EB] uppercase">增值税电子普通发票</div>
                                  <div className="text-[10px] text-[#64748B]">No. 0582491</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-[#64748B]">购方名称：</span>
                                    <span className="font-bold">{activeCustomer?.name}</span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-[#64748B]">货物服务：</span>
                                    <span className="font-bold">*设计服务*设计费</span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-[#64748B]">合计金额：</span>
                                    <span className="font-bold text-[#2563EB]">¥5,000.00</span>
                                  </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex justify-between gap-4">
                                  <button className="text-[10px] text-[#2563EB] font-bold hover:underline flex-1 text-center">点击查看详情</button>
                                  <button 
                                    onClick={() => handleDownloadInvoice(activeCustomer?.name || '客户')}
                                    className="flex items-center justify-center gap-1 text-[10px] text-[#64748B] font-bold hover:text-[#2563EB] transition-colors flex-1"
                                  >
                                    <Download size={12} /> 下载发票
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className={`text-[10px] mt-2 text-right ${m.sender === 'bot' ? 'text-[#64748B]' : 'text-blue-100 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                              {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {m.sender !== 'bot' && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ml-3 ring-2 ring-blue-100 shadow-sm border border-blue-200">
                              <img src={m.avatar || `https://picsum.photos/seed/default/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isBotTyping && (
                        <div className="flex justify-start items-start">
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 mr-3 ring-2 ring-indigo-100 shadow-sm border border-indigo-200">
                            <img src={BOT_AVATAR} alt="Bot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="bg-white rounded-tr-xl rounded-br-xl rounded-bl-xl p-4 shadow-sm border border-[#E2E8F0]">
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
                        <QuickAction label="代开票" onClick={() => setInputText('我想开张票，帮我处理一下。')} />
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
              className="p-8 max-w-7xl mx-auto"
            >
              <header className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">AI 服务工作台</h1>
                  <p className="text-slate-500 mt-1">全流程自动化服务状态监控与批量快速介入</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    已完成: 2,450 户
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium">
                    <Activity size={16} className="text-[#2563EB]" />
                    AI 自动处理中: 156 户
                  </div>
                </div>
              </header>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden blur-[0.2px]">
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="搜索客户..." 
                        className="w-full pl-9 pr-4 py-1.5 bg-white border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {selectedDocIds.length > 0 && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded"
                      >
                        已选中 {selectedDocIds.length} 家客户
                      </motion.span>
                    )}
                  </div>
                  <button 
                    onClick={startDocsDemo}
                    disabled={isAutoPlaying}
                    className="text-xs font-bold text-white bg-[#2563EB] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isAutoPlaying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 批量群内推送/催收
                  </button>
                </div>

                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedDocIds.length === customers.length}
                          onChange={(e) => setSelectedDocIds(e.target.checked ? customers.map(c => c.id) : [])}
                        />
                      </th>
                      <th className="px-6 py-4">客户/公司</th>
                      <th className="px-6 py-4 text-center">资料收集</th>
                      <th className="px-6 py-4 text-center">税金测算</th>
                      <th className="px-6 py-4 text-center">申报缴款</th>
                      <th className="px-6 py-4 text-center">缴款确认</th>
                      <th className="px-6 py-4">全流程进度</th>
                      <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map(c => {
                      const allDocsOk = c.docsReceived.invoice && c.docsReceived.bank && c.docsReceived.salary;
                      const isSelected = selectedDocIds.includes(c.id);
                      return (
                        <tr key={c.id} className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={isSelected}
                              onChange={() => setSelectedDocIds(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{c.industry}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {allDocsOk ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                                    <CheckCircle2 size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-emerald-600">已齐备</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100 animate-pulse">
                                    <Clock size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-amber-600">催收中</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {c.status === 'calculating' || c.status === 'filing' || c.status === 'paid' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-7 h-7 bg-blue-50 text-[#2563EB] rounded-lg flex items-center justify-center border border-blue-100">
                                    <TrendingUp size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-[#2563EB]">已生成</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-30">
                                  <div className="w-7 h-7 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center border border-slate-200">
                                    <TrendingUp size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400">进行中</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {c.status === 'filing' || c.status === 'paid' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
                                    <FileText size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-indigo-600">已扣款</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-30">
                                  <div className="w-7 h-7 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center border border-slate-200">
                                    <FileText size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400">等待中</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {c.status === 'paid' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                                    <CreditCard size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-emerald-600">已回传</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-30">
                                  <div className="w-7 h-7 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center border border-slate-200">
                                    <CreditCard size={14} />
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400">未缴款</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                                <motion.div 
                                  className={`h-full ${c.status === 'paid' ? 'bg-emerald-500' : 'bg-[#2563EB]'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-500">{c.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 max-w-3xl mx-auto"
            >
              <header className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight">系统通知设置</h1>
                <p className="text-slate-500 mt-2">配置 AccoBot 数字员工的自动预警与提醒规则</p>
              </header>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <Bell className="text-indigo-600" size={20} />
                    <h2 className="font-bold text-slate-800">通知类型配置</h2>
                  </div>
                  <div className="p-6 space-y-8">
                    <ToggleItem 
                      icon={<PieChart size={18} className="text-blue-500" />}
                      title="纳税申报截止提醒" 
                      description="在申报期结束前 3 天、1 天自动向客户发送催报消息"
                      defaultChecked={true}
                    />
                    <ToggleItem 
                      icon={<FileText size={18} className="text-amber-500" />}
                      title="原始资料缺件提醒" 
                      description="识别到流水、发票或工资表缺失时，自动发起催收流程"
                      defaultChecked={true}
                    />
                    <ToggleItem 
                      icon={<CreditCard size={18} className="text-emerald-500" />}
                      title="税金确认与缴款提醒" 
                      description="税金测算完成后，自动推送确认通知并提醒客户缴款"
                      defaultChecked={true}
                    />
                    <ToggleItem 
                      icon={<MessageSquare size={18} className="text-indigo-500" />}
                      title="客户咨询即时回复" 
                      description="当客户在群内咨询常见基础问题时，机器人自动拦截并回复"
                      defaultChecked={false}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <Settings className="text-slate-600" size={20} />
                    <h2 className="font-bold text-slate-800">通知渠道</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">企业微信群聊</p>
                          <p className="text-[10px] text-slate-400">数字员工直接在群内与客户互动</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">已激活</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 opacity-50">
                        <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                          <Send size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">短信/语音提醒</p>
                          <p className="text-[10px] text-slate-400">针对高风险欠缴客户的增强提醒</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-indigo-600 hover:underline">点击开启</button>
                    </div>
                  </div>
                </div>
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

function ToggleItem({ icon, title, description, defaultChecked }: { icon: React.ReactNode, title: string, description: string, defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`w-11 h-6 rounded-full transition-all relative ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'} shadow-sm`} />
      </button>
    </div>
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

function WorkbenchCard({ title, count, icon, color, description, onClick }: { title: string, count: number, icon: React.ReactNode, color: 'emerald' | 'blue' | 'red', description: string, onClick?: () => void }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-500/10',
    red: 'bg-red-50 text-red-600 border-red-100 ring-red-500/10'
  };
  
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-2xl border ${colorMap[color]} shadow-sm ring-1 flex flex-col justify-between h-40 transition-all hover:shadow-md hover:-translate-y-1 ${onClick ? 'cursor-pointer hover:ring-2' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
          {icon}
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/50 border border-current opacity-70`}>{title}</div>
      </div>
      <div>
        <div className="text-3xl font-black tracking-tight tracking-tight tabular-nums">{count}</div>
        <div className="text-[10px] opacity-70 font-medium mt-1 truncate">{description}</div>
      </div>
    </div>
  );
}
