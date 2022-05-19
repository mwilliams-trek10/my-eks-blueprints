import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { Construct } from 'constructs';
import { TeamPlatform, TeamApplication} from '../teams/index';

export default class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    
    const account = props?.env?.account!;
    const region = props?.env?.region!;
    
    const teamPlatform = new TeamPlatform(account);
    const teamApplication = new TeamApplication('burnham', account);
    
    // HERE WE ADD THE ARGOCD APP OF APPS REPO INFORMATION
    const repoUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';

    const bootstrapRepo : blueprints.ApplicationRepository = {
        repoUrl,
        targetRevision: 'workshop',
    }

    // HERE WE GENERATE THE ADDON CONFIGURATIONS
    const devBootstrapArgo = new blueprints.ArgoCDAddOn({
        bootstrapRepo: {
            ...bootstrapRepo,
            path: 'envs/dev'
        },
    });
    const testBootstrapArgo = new blueprints.ArgoCDAddOn({
        bootstrapRepo: {
            ...bootstrapRepo,
            path: 'envs/test'
        },
    });
    const prodBootstrapArgo = new blueprints.ArgoCDAddOn({
        bootstrapRepo: {
            ...bootstrapRepo,
            path: 'envs/prod'
        },
    });
    
    
    const autoscalerAddOn = new blueprints.ClusterAutoScalerAddOn();
    const kebeviousAddOn = new blueprints.KubeviousAddOn();
    
    const blueprint = blueprints.EksBlueprint
                      .builder()
                      .account(account)
                      .region(region)
                      .addOns(autoscalerAddOn, kebeviousAddOn)
                      .teams(teamPlatform, teamApplication);
                      
    const pipeline = blueprints.CodePipelineStack.builder()
                        .name("eks-blueprints-workshop-pipeline")
                        .owner("mwilliams-trek10")
                        .repository({
                            repoUrl: "my-eks-blueprints",
                            credentialsSecretName: "github-token",
                            targetRevision: "main"
                        })
                        .wave({
                                id: "envs",
                                stages: [
                                    { id: "dev", stackBuilder: blueprint.clone('us-west-2').addOns(devBootstrapArgo) },
                                    { id: "test", stackBuilder: blueprint.clone('us-east-2').addOns(testBootstrapArgo) },
                                    { id: "prod", stackBuilder: blueprint.clone('us-east-1').addOns(prodBootstrapArgo) },
                                    ]
                            })
                        .build(scope, id+"-stack", props);
    
  }
}
