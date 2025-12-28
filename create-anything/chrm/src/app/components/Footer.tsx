export default function Footer() {
  return (
    <footer className="bg-[#1e293b] border-t border-[#334155] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-[#94a3b8] font-inter">
            &copy; {new Date().getFullYear()} CHRM Alumni Association. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}