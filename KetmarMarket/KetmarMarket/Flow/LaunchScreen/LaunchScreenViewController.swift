import SnapKit
import UIKit

class LaunchScreenViewController: UIViewController {
    
    private let viewModel: LaunchScreenViewModel
    private weak var delegate: LaunchScreenViewControllerDelegate?
    
    private lazy var logoImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.image = UIImage(named: "ketmar_logo")
        imageView.contentMode = .scaleAspectFit
        return imageView
    }()
    
    private lazy var activityIndicator: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.color = .brandPrimary
        indicator.hidesWhenStopped = true
        return indicator
    }()
    
    init(
        viewModel: LaunchScreenViewModel,
        delegate: LaunchScreenViewControllerDelegate?
    ) {
        self.viewModel = viewModel
        self.delegate = delegate
        super.init(nibName: nil, bundle: nil)
    }
    
    @available(*, unavailable) required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupView()
        setupConstraints()
        startInitialization()
    }
    
    private func setupView() {
        view.backgroundColor = .white
        view.addSubview(logoImageView)
        view.addSubview(activityIndicator)
    }
    
    private func setupConstraints() {
        logoImageView.snp.makeConstraints { make in
            make.center.equalTo(view.safeAreaLayoutGuide)
            make.width.equalTo(300)
            make.height.equalTo(300)
        }
        
        activityIndicator.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.top.equalTo(logoImageView.snp.bottom).offset(40)
        }
    }
    
    private func startInitialization() {
        activityIndicator.startAnimating()
        
        viewModel.performInitialization { [weak self] in
            guard let self else { return }
            self.activityIndicator.stopAnimating()
            self.delegate?.launchScreenDidFinish()
        }
    }
}
