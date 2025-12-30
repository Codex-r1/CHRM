export default function Footer() {
  return (
    <footer className="bg-[#fff] border-t border-[#000] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-[#000] font-inter">
            &copy; {new Date().getFullYear()} CHRM Alumni Association. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}