import React, { useState } from 'react';
import { 
  BookOpen, 
  BookmarkCheck, 
  RotateCcw, 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  DollarSign, 
  CheckCircle2,
  Clock,
  User
} from 'lucide-react';
import { 
  Tenant, 
  UserRole, 
  BookItem, 
  BorrowRecord 
} from '../../types';
import { storageService } from '../../services/storageService';
import { WorkflowEngine } from '../../engine/workflowEngine';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface LibraryModulesViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  activeTab?: 'catalog' | 'circulation';
}

export const LibraryModulesView: React.FC<LibraryModulesViewProps> = ({
  activeTenant,
  activeTab: initialTab = 'circulation'
}) => {
  const [tab, setTab] = useState<'catalog' | 'circulation'>(initialTab);
  const books = storageService.getBooks();
  const borrowRecords = storageService.getBorrowRecords(activeTenant.id);
  const customers = storageService.getCustomers(activeTenant.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isIssueBookOpen, setIsIssueBookOpen] = useState(false);

  // New Book Form
  const [newBookData, setNewBookData] = useState<Partial<BookItem>>({
    isbn: '978-0-',
    title: '',
    author: '',
    publisher: '',
    edition: '1st Edition',
    category_genre: 'Fiction',
    shelf_location: 'Aisle 3 - Bay B',
    total_copies: 5,
    available_copies: 5
  });

  // Issue Book Form
  const [issueCustomerId, setIssueCustomerId] = useState('');
  const [issueBookId, setIssueBookId] = useState('');
  const [issueDays, setIssueDays] = useState(14);
  const [issueError, setIssueError] = useState<string | null>(null);

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookData.title || !newBookData.isbn) return;

    const bookToSave: BookItem = {
      id: `bk_${Date.now()}`,
      product_id: `prod_book_${Date.now()}`,
      isbn: newBookData.isbn,
      title: newBookData.title,
      author: newBookData.author || 'Unknown',
      publisher: newBookData.publisher || 'General Press',
      edition: newBookData.edition || '1st Edition',
      category_genre: newBookData.category_genre || 'General',
      shelf_location: newBookData.shelf_location || 'Aisle 1',
      total_copies: Number(newBookData.total_copies) || 1,
      available_copies: Number(newBookData.total_copies) || 1,
      condition: 'new'
    };

    storageService.saveBook(bookToSave);
    setIsAddBookOpen(false);
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);
    const member = customers.find(c => c.id === issueCustomerId);
    const book = books.find(b => b.id === issueBookId);

    if (!member || !book) {
      setIssueError('Please select both an active member and an available book.');
      return;
    }

    const result = WorkflowEngine.processBookIssue({
      tenant: activeTenant,
      member,
      book,
      durationDays: issueDays
    });

    if (!result.success) {
      setIssueError(result.error || 'Failed to issue book.');
      return;
    }

    setIsIssueBookOpen(false);
    setIssueCustomerId('');
    setIssueBookId('');
  };

  const handleReturnBook = (record: BorrowRecord) => {
    const result = WorkflowEngine.processBookReturn({
      borrowRecord: record,
      collectLateFee: true
    });

    if (result.success) {
      if (result.data?.calculated_late_fee && result.data.calculated_late_fee > 0) {
        alert(`Book returned. Late fee of $${result.data.calculated_late_fee.toFixed(2)} applied.`);
      } else {
        alert('Book returned on time. Record closed successfully.');
      }
    }
  };

  return (
    <div className="space-y-3.5 pb-8">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-sm font-bold text-[#1a1b1e] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            বই-খাতা, প্রকাশনী ও স্টেশনারি ম্যানেজমেন্ট
          </h1>
          <p className="text-[11px] text-[#868e96] mt-0.5">
            বইয়ের নাম, লেখক, প্রকাশনী, ISBN, গাইড বই, খাতা, কলম ও স্টেশনারি সামগ্রীর স্টক এবং পাইকারি/খুচরা সরবরাহ।
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#f8f9fa] p-1 rounded-lg border border-[#dee2e6]">
          <button
            type="button"
            onClick={() => setTab('catalog')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'catalog'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-[#495057] hover:text-[#1a1b1e]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            বই-খাতা ক্যাটালগ ({books.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('circulation')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'circulation'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-[#495057] hover:text-[#1a1b1e]'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            বুকস্টোর সেলস ও সাপ্লাই ({borrowRecords.length})
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 1. CIRCULATION & RETURNS TAB */}
      {/* ================================================== */}
      {tab === 'circulation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2.5 bg-white p-3 rounded-lg border border-[#dee2e6] shadow-xs">
            <div className="text-xs text-[#868e96] font-medium">
              Manage active member borrowings, check due dates, and settle late returns.
            </div>
            <button
              type="button"
              onClick={() => setIsIssueBookOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Issue Book to Member</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#868e96] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Borrower / Member</th>
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 font-mono">Late Fine</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {borrowRecords.map(rec => {
                  const isReturned = rec.status === 'returned';

                  return (
                    <tr key={rec.id} className="hover:bg-[#f8f9fa]">
                      <td className="py-2.5 px-3 font-bold text-[#1a1b1e]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          <span>{rec.member_name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-[#1a1b1e]">
                        {rec.book_title}
                      </td>

                      <td className="py-2.5 px-3 text-[#495057] font-mono">
                        {rec.issue_date}
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        <span className="font-bold text-[#1a1b1e]">{rec.due_date}</span>
                        {rec.status === 'overdue' && (
                          <span className="block text-[10px] text-rose-600 font-bold">Overdue!</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <Badge variant={rec.status === 'returned' ? 'success' : rec.status === 'overdue' ? 'danger' : 'amber'} size="sm">
                          {rec.status}
                        </Badge>
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        {rec.calculated_late_fee > 0 ? (
                          <span className="font-bold text-rose-600">${rec.calculated_late_fee.toFixed(2)}</span>
                        ) : (
                          <span className="text-[#868e96]">$0.00</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {!isReturned && (
                          <button
                            type="button"
                            onClick={() => handleReturnBook(rec)}
                            className="px-2 py-0.5 bg-[#1a1b1e] hover:bg-[#141517] text-white rounded text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. BOOK CATALOG TAB */}
      {/* ================================================== */}
      {tab === 'catalog' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2.5 bg-white p-3 rounded-lg border border-[#dee2e6] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#868e96] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Title, Author, ISBN, Genre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded text-xs text-[#1a1b1e] focus:outline-hidden focus:ring-1 focus:ring-amber-600 focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAddBookOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catalog New Book</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {books
              .filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.author.toLowerCase().includes(searchTerm.toLowerCase()) || b.isbn.includes(searchTerm))
              .map(b => (
                <div key={b.id} className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#868e96] mb-1">
                      <span>ISBN: {b.isbn}</span>
                      <span className="bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded font-sans">{b.category_genre}</span>
                    </div>

                    <h3 className="text-xs font-bold text-[#1a1b1e] leading-tight">
                      {b.title}
                    </h3>
                    <p className="text-[11px] text-[#495057] mt-0.5">by <span className="font-semibold">{b.author}</span></p>
                    <p className="text-[10px] text-[#868e96]">{b.publisher} • {b.edition}</p>
                  </div>

                  <div className="pt-2 border-t border-[#dee2e6] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] text-[#868e96] block font-semibold uppercase">Shelf Location</span>
                      <span className="font-semibold text-[#495057] text-[11px]">{b.shelf_location}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#868e96] block font-semibold uppercase">Availability</span>
                      <span className="font-bold text-amber-700 font-mono text-xs">
                        {b.available_copies} / {b.total_copies} copies
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal: Catalog Book */}
      <Modal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        title="Catalog New Book Title"
        subtitle="Library & Archive Master Registration"
      >
        <form onSubmit={handleCreateBook} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#495057] mb-1">Book Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Clean Architecture"
              value={newBookData.title || ''}
              onChange={e => setNewBookData({ ...newBookData, title: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Author(s) *</label>
              <input
                type="text"
                required
                placeholder="Robert C. Martin"
                value={newBookData.author || ''}
                onChange={e => setNewBookData({ ...newBookData, author: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">ISBN *</label>
              <input
                type="text"
                required
                placeholder="978-0134494166"
                value={newBookData.isbn || ''}
                onChange={e => setNewBookData({ ...newBookData, isbn: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded font-mono text-[#1a1b1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Genre</label>
              <input
                type="text"
                value={newBookData.category_genre || ''}
                onChange={e => setNewBookData({ ...newBookData, category_genre: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Shelf Location</label>
              <input
                type="text"
                placeholder="Section C-4"
                value={newBookData.shelf_location || ''}
                onChange={e => setNewBookData({ ...newBookData, shelf_location: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Total Copies</label>
              <input
                type="number"
                value={newBookData.total_copies}
                onChange={e => setNewBookData({ ...newBookData, total_copies: parseInt(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={() => setIsAddBookOpen(false)}
              className="px-3 py-1.5 text-[#495057] hover:text-[#1a1b1e] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow-xs cursor-pointer"
            >
              Catalog Book Title
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Issue Book to Member */}
      <Modal
        isOpen={isIssueBookOpen}
        onClose={() => setIsIssueBookOpen(false)}
        title="Issue Book to Member"
        subtitle="Circulation Loan Registration with Rule Validation"
      >
        <form onSubmit={handleIssueBook} className="space-y-3 text-xs">
          {issueError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{issueError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#495057] mb-1">Select Member / Borrower *</label>
            <select
              required
              value={issueCustomerId}
              onChange={e => setIssueCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
            >
              <option value="">-- Choose Member --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - Current Due: ${c.current_due.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#495057] mb-1">Select Book Title *</label>
            <select
              required
              value={issueBookId}
              onChange={e => setIssueBookId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
            >
              <option value="">-- Choose Available Book --</option>
              {books.filter(b => b.available_copies > 0).map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} by {b.author} ({b.available_copies} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#495057] mb-1">Lending Duration (Days)</label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setIssueDays(d)}
                  className={`py-1 rounded border font-bold text-xs cursor-pointer ${
                    issueDays === d ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f8f9fa] border-[#dee2e6] text-[#495057]'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={() => setIsIssueBookOpen(false)}
              className="px-3 py-1.5 text-[#495057] hover:text-[#1a1b1e] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow-xs cursor-pointer"
            >
              Confirm Circulation Loan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
